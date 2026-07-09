import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrmService, Product } from '../../services/crm.service';

@Component({
  selector: 'app-product-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-discovery.component.html',
  styleUrls: ['./product-discovery.component.css']
})
export class ProductDiscoveryComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';
  selectedFamily: string = '';
  families: string[] = ['GCP', 'Workspace', 'Chrome', 'Maps', 'PSO'];
  cart: Product[] = [];
  isCartOpen: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private crmService: CrmService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.crmService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoading = false;
      }
    });
  }

  selectFamily(family: string): void {
    if (this.selectedFamily === family) {
      this.selectedFamily = ''; // Toggle off
    } else {
      this.selectedFamily = family;
    }
    this.applyFilters();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value || '';
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.products];

    // Filter by family
    if (this.selectedFamily) {
      result = result.filter(p => p.family.toLowerCase() === this.selectedFamily.toLowerCase());
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.family.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = result;
  }

  addToCart(product: Product): void {
    if (!this.isInCart(product.id)) {
      this.cart.push(product);
      this.isCartOpen = true;
    }
  }

  removeFromCart(productId: string): void {
    this.cart = this.cart.filter(p => p.id !== productId);
    if (this.cart.length === 0) {
      this.isCartOpen = false;
    }
  }

  isInCart(productId: string): boolean {
    return this.cart.some(p => p.id === productId);
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  onBack(): void {
    this.router.navigate(['/opportunities']);
  }

  onContinue(): void {
    const oppId = sessionStorage.getItem('selectedOpportunityId');
    if (!oppId) {
      alert('Session expired. Please select an opportunity first.');
      this.router.navigate(['/opportunities']);
      return;
    }

    if (this.cart.length === 0) {
      return;
    }

    this.isLoading = true;
    const productIds = this.cart.map(p => p.id);

    this.crmService.createQuote(oppId, productIds).subscribe({
      next: (quoteRes) => {
        if (quoteRes.success && quoteRes.salesTransactionId) {
          this.crmService.getQuoteDetails(quoteRes.salesTransactionId).subscribe({
            next: (details) => {
              sessionStorage.setItem('createdQuoteId', details.Id);
              sessionStorage.setItem('createdQuoteNumber', details.QuoteNumber);
              this.isLoading = false;
              this.router.navigate(['/quote-details']);
            },
            error: (err) => {
              console.error('Failed to get quote details', err);
              // Fallback routing even if details fails
              sessionStorage.setItem('createdQuoteId', quoteRes.salesTransactionId);
              sessionStorage.setItem('createdQuoteNumber', 'Q-000000');
              this.isLoading = false;
              this.router.navigate(['/quote-details']);
            }
          });
        } else {
          alert('Failed to place quote transaction.');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to create quote', err);
        alert('An error occurred while creating the quote.');
        this.isLoading = false;
      }
    });
  }
}

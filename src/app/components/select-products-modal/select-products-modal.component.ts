import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService, Product } from '../../services/crm.service';

export interface ModalProduct extends Product {
  selected: boolean;
  value: string;
}

@Component({
  selector: 'app-select-products-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-products-modal.component.html',
  styleUrl: './select-products-modal.component.css'
})
export class SelectProductsModalComponent implements OnInit {
  @Input() mode: 'Discount' | 'Incentive' = 'Discount';
  @Input() granularity: 'Overall' | 'Granular' = 'Overall';
  @Input() initialSelectedProducts: any[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any[]>();

  activeTab: 'Groups' | 'Individuals' = 'Groups';
  groupProducts: ModalProduct[] = [];
  individualProducts: ModalProduct[] = [];
  filter: 'All' | 'Selected' = 'All';
  searchTerm: string = '';
  activeGroupId: string | null = null;
  
  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;
  isLoading = false;

  constructor(private crmService: CrmService) {}

  ngOnInit(): void {
    // Fetch Product Groups
    this.crmService.getProducts().subscribe(apiProducts => {
      this.groupProducts = this.mapProducts(apiProducts);
      // Auto-select the first group using its unique id for UI tracking
      if (this.groupProducts.length > 0) {
        this.selectGroupFacet(this.groupProducts[0].id);
      }
    });

    // Global Search listener with debounce
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.executeFacetedSearch();
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  selectGroupFacet(groupId: string | null): void {
    if (this.activeGroupId === groupId) {
      this.activeGroupId = null;
    } else {
      this.activeGroupId = groupId;
    }
    this.executeFacetedSearch();
  }

  private executeFacetedSearch(): void {
    this.isLoading = true;
    
    // Map the selected UI group to its Salesforce classification ID
    let apiSearchId: string | undefined = undefined;
    if (this.activeGroupId) {
      const activeGroup = this.groupProducts.find(g => g.id === this.activeGroupId);
      // Fall back to id if classificationId is missing
      apiSearchId = activeGroup?.classificationId || this.activeGroupId;
    }

    this.crmService.facetedProductSearch(apiSearchId, this.searchTerm)
      .subscribe({
        next: (products) => {
          this.individualProducts = this.mapProducts(products);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch filtered products:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  private mapProducts(apiProducts: Product[]): ModalProduct[] {
    return apiProducts.map(p => {
      const preselected = this.initialSelectedProducts.find(ip => ip.id === p.id);
      return {
        ...p,
        selected: !!preselected,
        value: preselected ? preselected.value : '',
        classificationId: p.classificationId
      };
    });
  }

  get allProducts(): ModalProduct[] {
    return [...this.groupProducts, ...this.individualProducts];
  }

  get filteredProducts(): ModalProduct[] {
    let currentList = this.activeTab === 'Groups' ? this.groupProducts : this.individualProducts;
    
    if (this.filter === 'Selected') {
      currentList = currentList.filter(p => p.selected);
    }
    
    // Local filtering removed since we are now doing real-time backend Global Search
    return currentList;
  }

  get selectedCount(): number {
    return this.allProducts.filter(p => p.selected).length;
  }

  isValidToConfirm(): boolean {
    const selected = this.allProducts.filter(p => p.selected);
    if (selected.length === 0) return true; // allow empty selection
    
    if (this.mode === 'Incentive' || (this.mode === 'Discount' && this.granularity === 'Granular')) {
      // If granular/incentive, ensure a value is typed for all selected
      return selected.every(p => p.value && p.value.trim().length > 0);
    }
    return true;
  }

  onConfirm(): void {
    if (this.isValidToConfirm()) {
      // De-duplicate in case a product appears in both lists, using a Map
      const selectedMap = new Map();
      this.allProducts.filter(p => p.selected).forEach(p => {
        selectedMap.set(p.id, {
          id: p.id,
          name: p.name,
          family: p.family,
          value: p.value
        });
      });
      this.confirm.emit(Array.from(selectedMap.values()));
    }
  }
}

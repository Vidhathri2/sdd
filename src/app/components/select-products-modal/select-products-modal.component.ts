import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService, Product } from '../../services/crm.service';

export interface ModalProduct extends Product {
  selected: boolean;
  value: string;
  noOfChildProducts?: number;
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
    // Fetch Product Groups/Classifications for the active configured bundle product
    const bundleProductId = sessionStorage.getItem('mockConfiguredProductId') || '01tDz00000Eah7vIAB';
    this.crmService.getProductClassifications(bundleProductId).subscribe({
      next: (classifications) => {
        const filtered = (classifications || []).filter(c => {
          const name = c.Name || c.name || '';
          return name !== 'ROOT - Enterprise Services' && name !== 'ROOT_ENTERPRISE_SERVICES';
        });
        this.groupProducts = filtered.map(c => ({
          id: c.Id || c.id || '',
          name: c.Name || c.name || '',
          family: 'Classification',
          icon: 'Folder',
          classificationId: c.Id || c.id || '',
          selected: false,
          value: '',
          noOfChildProducts: c.No_Of_Child_Products__c || c.noOfChildProducts || 0
        }));
        // Auto-select the first group using its unique id for UI tracking
        if (this.groupProducts.length > 0) {
          this.selectGroupFacet(this.groupProducts[0].id);
        }
      },
      error: (err) => {
        console.warn('Failed to fetch classifications, falling back to standard products as groups.', err);
        this.crmService.getProducts().subscribe(apiProducts => {
          this.groupProducts = this.mapProducts(apiProducts);
          if (this.groupProducts.length > 0) {
            this.selectGroupFacet(this.groupProducts[0].id);
          }
        });
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

  sortDirection: 'asc' | 'desc' = 'asc';

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  get filteredProducts(): ModalProduct[] {
    let currentList = this.activeTab === 'Groups' ? this.groupProducts : this.individualProducts;
    
    if (this.filter === 'Selected') {
      currentList = currentList.filter(p => p.selected);
    }
    
    if (this.activeTab === 'Groups' && this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      currentList = currentList.filter(p => p.name.toLowerCase().includes(q));
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...currentList].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB) * dir;
    });
  }

  get isAllSelected(): boolean {
    const list = this.filteredProducts;
    if (list.length === 0) return false;
    return list.every(p => p.selected);
  }

  toggleSelectAll(checked: boolean): void {
    this.filteredProducts.forEach(p => {
      p.selected = checked;
    });
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

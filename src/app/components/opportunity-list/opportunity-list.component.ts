import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CrmService } from '../../services/crm.service';

interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  owner: string;
  amount: number;
  closeDate: string;
  primaryContact: string;
}

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunity-list.component.html',
  styleUrls: ['./opportunity-list.component.css']
})
export class OpportunityListComponent implements OnInit, OnDestroy {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  displayedOpportunities: Opportunity[] = [];

  // State Management
  isLoading = true;
  fetchError = false;
  searchSubject = new Subject<string>();
  searchSubscription!: Subscription;
  searchQuery = '';

  // Sort State
  sortAscending = true;

  // Pagination State
  currentPage = 1;
  pageSize = 10; // Default to 10 as per specs
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Action Menu State
  activeMenuOppId: string | null = null;

  constructor(
    private crmService: CrmService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Setup debounced search input handling
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    });

    this.loadOpportunities();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.fetchError = false;
    this.crmService.getOpportunities().subscribe({
      next: (data) => {
        this.opportunities = data;
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching opportunities:', err);
        this.fetchError = true;
        this.isLoading = false;
      }
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  toggleSort(): void {
    this.sortAscending = !this.sortAscending;
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination(): void {
    // 1. Filter
    let result = [...this.opportunities];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(opp => 
        opp.name.toLowerCase().includes(q) ||
        opp.accountName.toLowerCase().includes(q) ||
        opp.owner.toLowerCase().includes(q)
      );
    }

    // 2. Sort by Opportunity Name
    result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return this.sortAscending ? -1 : 1;
      if (nameA > nameB) return this.sortAscending ? 1 : -1;
      return 0;
    });

    this.filteredOpportunities = result;

    // 3. Paginate
    const totalItems = this.filteredOpportunities.length;
    const maxPage = Math.max(1, Math.ceil(totalItems / this.pageSize));
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    this.displayedOpportunities = this.filteredOpportunities.slice(startIndex, endIndex);
  }

  // Pagination Actions
  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  goToNextPage(): void {
    const maxPage = Math.ceil(this.filteredOpportunities.length / this.pageSize);
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  goToLastPage(): void {
    const maxPage = Math.ceil(this.filteredOpportunities.length / this.pageSize);
    if (this.currentPage < maxPage) {
      this.currentPage = maxPage;
      this.applyFiltersAndPagination();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  // Pagination Indicators
  get startIndex(): number {
    if (this.filteredOpportunities.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredOpportunities.length);
  }

  get totalItems(): number {
    return this.filteredOpportunities.length;
  }

  get isFirstPageDisabled(): boolean {
    return this.currentPage === 1;
  }

  get isLastPageDisabled(): boolean {
    const maxPage = Math.ceil(this.filteredOpportunities.length / this.pageSize);
    return this.currentPage === maxPage || this.filteredOpportunities.length === 0;
  }

  // Menu toggling
  toggleMenu(oppId: string, event: Event): void {
    event.stopPropagation();
    if (this.activeMenuOppId === oppId) {
      this.activeMenuOppId = null;
    } else {
      this.activeMenuOppId = oppId;
    }
  }

  closeMenu(): void {
    this.activeMenuOppId = null;
  }

  // Quote redirection
  createQuote(opp: Opportunity, event: Event): void {
    event.stopPropagation();
    this.closeMenu();

    // Cache opportunity details in sessionStorage
    sessionStorage.setItem('selectedOpportunityId', opp.id);
    sessionStorage.setItem('selectedAccountName', opp.accountName);
    sessionStorage.setItem('selectedOpportunityName', opp.name);
    sessionStorage.setItem('selectedPrimaryContact', opp.primaryContact);

    // Redirect to select-products screen
    this.router.navigate(['/select-products']);
  }
}

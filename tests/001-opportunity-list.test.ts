import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OpportunityListComponent } from '../src/app/components/opportunity-list/opportunity-list.component';
import { CrmService } from '../src/app/services/crm.service';

describe('OpportunityListComponent (Angular & Tailwind)', () => {
  let component: OpportunityListComponent;
  let fixture: ComponentFixture<OpportunityListComponent>;
  let mockCrmService: jasmine.SpyObj<CrmService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const dummyOpportunities = Array.from({ length: 33 }, (_, i) => ({
    id: `opp-id-${i + 1}`,
    name: `Opportunity Name ${i + 1}`,
    accountName: `Account Name ${i + 1}`,
    owner: `Owner ${i + 1}`,
    amount: 10000 * (i + 1),
    closeDate: `2026-07-0${(i % 9) + 1}`,
    primaryContact: `Sarah Connor ${i + 1}`
  }));

  beforeEach(async () => {
    mockCrmService = jasmine.createSpyObj('CrmService', ['getOpportunities']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Set up session storage spy
    spyOn(sessionStorage, 'setItem');

    await TestBed.configureTestingModule({
      imports: [OpportunityListComponent],
      providers: [
        { provide: CrmService, useValue: mockCrmService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunityListComponent);
    component = fixture.componentInstance;
  });

  describe('1. UI Structure & Landing Page Layout', () => {
    it('should render the Deal Studio header with title and search input', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities.slice(0, 5)));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const headerTitle = element.querySelector('h1');
      const searchInput = element.querySelector('input[placeholder="Search"]');

      expect(headerTitle).toBeTruthy();
      expect(headerTitle?.textContent).toContain('Deal Studio');
      expect(searchInput).toBeTruthy();
    });

    it('should render the table with correct headers', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities.slice(0, 5)));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const headers = Array.from(element.querySelectorAll('th')).map(th => th.textContent?.trim());
      
      expect(headers).toContain('Opportunity Name');
      expect(headers).toContain('Account Name');
      expect(headers).toContain('Owner');
      expect(headers).toContain('Amount');
      expect(headers).toContain('Close Date');
    });
  });

  describe('2. Paginated Loading & Pagination Navigation', () => {
    it('should display 10 rows per page by default', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const rows = element.querySelectorAll('tbody tr');
      expect(rows.length).toBe(10);
    });

    it('should correctly display pagination indicators (e.g., 1-10 of 33)', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const indicator = element.querySelector('.pagination-indicator');
      expect(indicator?.textContent?.trim()).toBe('1-10 of 33');
    });

    it('should navigate to next page and update indicators when next button is clicked', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const nextBtn: HTMLButtonElement | null = element.querySelector('button.page-next');
      expect(nextBtn).toBeTruthy();

      nextBtn?.click();
      fixture.detectChanges();

      const indicator = element.querySelector('.pagination-indicator');
      expect(indicator?.textContent?.trim()).toBe('11-20 of 33');
    });

    it('should disable previous and first page buttons on page 1', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const prevBtn: HTMLButtonElement | null = element.querySelector('button.page-prev');
      const firstBtn: HTMLButtonElement | null = element.querySelector('button.page-first');

      expect(prevBtn?.disabled).toBeTrue();
      expect(firstBtn?.disabled).toBeTrue();
    });

    it('should update page size when rows per page selector is changed', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const select: HTMLSelectElement | null = element.querySelector('.rows-per-page-select');
      expect(select).toBeTruthy();

      if (select) {
        select.value = '25';
        select.dispatchEvent(new Event('change'));
      }
      fixture.detectChanges();

      const rows = element.querySelectorAll('tbody tr');
      expect(rows.length).toBe(25);
    });
  });

  describe('3. Action Menu & Session Caching (Quote Ingress)', () => {
    it('should display the floating Create Quote menu item when action button (three-dots) is clicked', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities.slice(0, 1)));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const actionBtn: HTMLButtonElement | null = element.querySelector('.action-menu-btn');
      expect(actionBtn).toBeTruthy();

      actionBtn?.click();
      fixture.detectChanges();

      const createQuoteAction = element.querySelector('.create-quote-action');
      expect(createQuoteAction).toBeTruthy();
      expect(createQuoteAction?.textContent?.trim()).toContain('Create Quote');
    });

    it('should cache opportunity details in sessionStorage and navigate to /select-products on Create Quote click', () => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities.slice(0, 1)));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const actionBtn: HTMLButtonElement | null = element.querySelector('.action-menu-btn');
      actionBtn?.click();
      fixture.detectChanges();

      const createQuoteAction: HTMLElement | null = element.querySelector('.create-quote-action');
      createQuoteAction?.click();
      fixture.detectChanges();

      expect(sessionStorage.setItem).toHaveBeenCalledWith('selectedOpportunityId', 'opp-id-1');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('selectedAccountName', 'Account Name 1');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('selectedOpportunityName', 'Opportunity Name 1');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('selectedPrimaryContact', 'Sarah Connor 1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/select-products']);
    });
  });

  describe('4. Search Real-time Keyword Filtering', () => {
    it('should filter rows dynamically based on search query', fakeAsync(() => {
      mockCrmService.getOpportunities.and.returnValue(of(dummyOpportunities));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const searchInput: HTMLInputElement | null = element.querySelector('input[placeholder="Search"]');
      expect(searchInput).toBeTruthy();

      if (searchInput) {
        searchInput.value = 'Opportunity Name 12';
        searchInput.dispatchEvent(new Event('input'));
      }
      tick(300); // Account for debounce time
      fixture.detectChanges();

      const rows = element.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].querySelector('.opp-name')?.textContent).toContain('Opportunity Name 12');
    }));
  });

  describe('5. Edge Cases & Error States', () => {
    it('should render empty state message if opportunities array is empty', () => {
      mockCrmService.getOpportunities.and.returnValue(of([]));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const emptyState = element.querySelector('.empty-state-message');
      
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent?.trim()).toBe('No opportunities found. Please create an opportunity to start.');
    });

    it('should render red error toast if fetch/load fails', () => {
      mockCrmService.getOpportunities.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const errorToast = element.querySelector('.error-toast');

      expect(errorToast).toBeTruthy();
      expect(errorToast?.textContent?.trim()).toBe('Failed to load opportunities. Please refresh the page.');
    });
  });
});

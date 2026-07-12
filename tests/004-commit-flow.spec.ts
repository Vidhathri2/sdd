import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommitFlowComponent } from '../src/app/components/commit-flow/commit-flow.component';
import { SelectProductsModalComponent } from '../src/app/components/select-products-modal/select-products-modal.component';
import { UploadProductsModalComponent } from '../src/app/components/upload-products-modal/upload-products-modal.component';
import { QuotePreviewModalComponent } from '../src/app/components/quote-preview-modal/quote-preview-modal.component';
import { CrmService } from '../src/app/services/crm.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

class MockCrmService {
  updateQuoteDates = jasmine.createSpy('updateQuoteDates').and.returnValue(Promise.resolve({}));
  createQuoteLineCommitments = jasmine.createSpy('createQuoteLineCommitments').and.returnValue(Promise.resolve({}));
  getProducts = jasmine.createSpy('getProducts').and.returnValue(of([
    { id: '1', name: 'API Management', family: 'API', icon: '', pricebookEntryId: 'pb1' }
  ]));
  facetedProductSearch = jasmine.createSpy('facetedProductSearch').and.returnValue(of([]));
  globalSearchProducts = jasmine.createSpy('globalSearchProducts').and.returnValue(of([]));
}

describe('Phase 2: Commit Flow with Discounts & Incentives', () => {
  let component: CommitFlowComponent;
  let fixture: ComponentFixture<CommitFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        CommitFlowComponent,
        SelectProductsModalComponent,
        UploadProductsModalComponent,
        QuotePreviewModalComponent
      ],
      providers: [
        { provide: CrmService, useClass: MockCrmService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommitFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Dynamic Calculation Logic', () => {
    it('should calculate totals correctly on initialization or update', () => {
      // Create a valid config state (mocking the internal tracking variables)
      component.commitmentPeriods = [
        { months: '12', amount: 100000, amountStr: '100,000', isCollapsed: false },
        { months: '24', amount: 50000, amountStr: '50,000', isCollapsed: false }
      ];
      
      let emittedMonths = 0;
      let emittedAmount = 0;
      
      component.totalsChanged.subscribe((event) => {
        emittedMonths = event.months;
        emittedAmount = event.amount;
      });

      component.calculateTotals();

      setTimeout(() => {
        expect(emittedMonths).toBe(36);
        expect(emittedAmount).toBe(150000);
      }, 0);
    });
  });

  describe('Discounts & Incentives State Gates', () => {
    it('should disable Discounts tab if commitment periods are invalid', () => {
      component.commitmentPeriods = [{ months: '', amount: null, amountStr: '', isCollapsed: false }]; // Invalid
      expect(component.canNavigateToDiscounts()).toBeFalse();

      component.commitmentPeriods = [{ months: '12', amount: 50000, amountStr: '50,000', isCollapsed: false }]; // Valid
      expect(component.canNavigateToDiscounts()).toBeTrue();
    });
  });

  describe('Granular Modals Validation', () => {
    it('should prevent confirming granular selection if a value is missing', () => {
      // Mock modal logic
      const modalFixture = TestBed.createComponent(SelectProductsModalComponent);
      const modal = modalFixture.componentInstance;
      modal.granularity = 'Granular';
      modal.activeTab = 'Individuals';
      modal.individualProducts = [
        { id: '1', name: 'API Management', family: 'API', icon: '', pricebookEntryId: 'pb1', selected: true, value: '' }, // Invalid value (needs to be specified)
      ];

      expect(modal.isValidToConfirm()).toBeFalse();

      modal.individualProducts[0].value = '1223'; // Valid value
      expect(modal.isValidToConfirm()).toBeTrue();
    });
  });

  describe('Faceted & Global Search (TDD)', () => {
    let modal: SelectProductsModalComponent;
    let mockCrm: MockCrmService;

    beforeEach(() => {
      const modalFixture = TestBed.createComponent(SelectProductsModalComponent);
      modal = modalFixture.componentInstance;
      mockCrm = TestBed.inject(CrmService) as unknown as MockCrmService;
      
      // Reset spies before each test
      mockCrm.facetedProductSearch.calls.reset();
      mockCrm.globalSearchProducts.calls.reset();
      
      modalFixture.detectChanges(); // triggers ngOnInit
    });

    it('should trigger search with debounce (7.1)', fakeAsync(() => {
      // Clear init calls
      mockCrm.facetedProductSearch.calls.reset();

      // Action: simulate typing rapidly
      modal.onSearchChange('L');
      modal.onSearchChange('Lo');
      modal.onSearchChange('Loo');
      modal.onSearchChange('Look');
      modal.onSearchChange('Looker');

      tick(200); // Wait partially
      expect(mockCrm.facetedProductSearch).not.toHaveBeenCalled();

      tick(100); // Total 300ms passed since last keystroke
      expect(mockCrm.facetedProductSearch).toHaveBeenCalledTimes(1);
      // Auto-selected group ID is '1' on init
      expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith('1', 'Looker');
    }));

    it('should trigger search when search is cleared (7.2)', fakeAsync(() => {
      mockCrm.facetedProductSearch.calls.reset();

      modal.onSearchChange(''); // cleared
      tick(300);

      expect(mockCrm.facetedProductSearch).toHaveBeenCalledTimes(1);
      expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith('1', '');
    }));

    it('should pass activeGroupId to API when a group is selected (7.3)', fakeAsync(() => {
      mockCrm.facetedProductSearch.calls.reset();

      // Click a different group pill
      modal.selectGroupFacet('2');
      tick(300);

      expect(mockCrm.facetedProductSearch).toHaveBeenCalledTimes(1);
      expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith('2', '');
    }));

    it('should clear activeGroupId when the same group is clicked again (7.4)', fakeAsync(() => {
      // First select it
      modal.selectGroupFacet('2');
      tick(300);
      mockCrm.facetedProductSearch.calls.reset();

      // Then click it again to deselect
      modal.selectGroupFacet('2');
      tick(300);

      expect(mockCrm.facetedProductSearch).toHaveBeenCalledTimes(1);
      expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith(undefined, '');
    }));

    it('should combine global search string and group filter (7.5)', fakeAsync(() => {
      mockCrm.facetedProductSearch.calls.reset();

      modal.selectGroupFacet('3');
      modal.onSearchChange('Storage');
      tick(300);

      expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith('3', 'Storage');
    }));
  });
});

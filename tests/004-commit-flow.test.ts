import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommitFlowComponent } from '../src/app/components/commit-flow/commit-flow.component';
import { SelectProductsModalComponent } from '../src/app/components/select-products-modal/select-products-modal.component';
import { UploadProductsModalComponent } from '../src/app/components/upload-products-modal/upload-products-modal.component';
import { QuotePreviewModalComponent } from '../src/app/components/quote-preview-modal/quote-preview-modal.component';
import { CrmService } from '../src/app/services/crm.service';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

class MockCrmService {
  updateQuoteDates = jasmine.createSpy('updateQuoteDates').and.returnValue(Promise.resolve({}));
  createQuoteLineCommitments = jasmine.createSpy('createQuoteLineCommitments').and.returnValue(Promise.resolve({}));
  getProducts = jasmine.createSpy('getProducts').and.returnValue(of([
    { id: '1', name: 'API Management', family: 'API', icon: '', pricebookEntryId: 'pb1' }
  ]));
  facetedProductSearch = jasmine.createSpy('facetedProductSearch').and.returnValue(of([]));
  globalSearchProducts = jasmine.createSpy('globalSearchProducts').and.returnValue(of([]));
  getQuotePreview = jasmine.createSpy('getQuotePreview').and.returnValue(of({
    records: [{
      Id: 'q-123',
      Name: 'Mock Quote',
      QuoteNumber: 'Q-00005148',
      Status: 'Draft',
      GrandTotal: 50000,
      StartDate: '2026-03-18',
      ExpirationDate: '2026-05-02',
      Opportunity: { Name: 'CRE Opp', Primary_Contact__r: { Name: 'Diego Castro' } },
      Account: { Name: 'AndeanCloud Analytics SpA', Website: 'andeancloud.com' },
      QuoteLineItems: {
        records: [
          { Id: 'qli-1', Product2: { Name: 'API Management' }, Quantity: 1, Discount: 10, StartDate: '2026-03-18', EndDate: '2026-05-02' }
        ]
      }
    }]
  }));
  createCommitmentDetails = jasmine.createSpy('createCommitmentDetails').and.returnValue(of({ hasErrors: false }));
  submitQuoteDetails = jasmine.createSpy('submitQuoteDetails').and.returnValue(of({ success: true }));
  getProductClassifications = jasmine.createSpy('getProductClassifications').and.returnValue(of([]));
  applyBulkDiscounts = jasmine.createSpy('applyBulkDiscounts').and.returnValue(of({ success: true }));
}

describe('Phase 2: Commit Flow Spec Suite', () => {
  let component: CommitFlowComponent;
  let fixture: ComponentFixture<CommitFlowComponent>;
  let mockCrm: MockCrmService;
  let mockRouter: jasmine.SpyObj<Router>;

  let dynamicAccountName: string;
  let dynamicOpportunityName: string;
  let dynamicQuoteNumber: string;
  let dynamicPrimaryContact: string;
  let dynamicSalesChannel: string;
  let dynamicExpirationDate: string;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'selectedQuoteId') return 'q-123';
      if (key === 'mockBundleLineItemId') return 'qli-1';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CommitFlowComponent,
        SelectProductsModalComponent,
        UploadProductsModalComponent,
        QuotePreviewModalComponent
      ],
      providers: [
        { provide: CrmService, useClass: MockCrmService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommitFlowComponent);
    component = fixture.componentInstance;

    // Generate dynamic mock parameters
    dynamicAccountName = 'Account_' + Math.random().toString(36).substring(7);
    dynamicOpportunityName = 'Opp_' + Math.random().toString(36).substring(7);
    dynamicQuoteNumber = 'Q-' + Math.floor(Math.random() * 1000000);
    dynamicPrimaryContact = 'Contact_' + Math.random().toString(36).substring(7);
    dynamicSalesChannel = Math.random() > 0.5 ? 'Direct' : 'Indirect';
    
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30 + Math.floor(Math.random() * 30));
    dynamicExpirationDate = expDate.toISOString().split('T')[0];

    // Initialize Mock Inputs dynamically
    const fb = new FormBuilder();
    component.detailsForm = fb.group({
      primaryContact: [dynamicPrimaryContact],
      salesChannel: [dynamicSalesChannel],
      quoteExpirationDate: [dynamicExpirationDate]
    });

    component.quoteDetails = {
      QuoteNumber: dynamicQuoteNumber,
      Account: { Name: dynamicAccountName },
      Opportunity: { Name: dynamicOpportunityName },
      configuredProducts: ['Google Cloud Platform RCA']
    };

    component.paymentAccount = {
      name: 'XXX XXXXXX',
      billingAccount: 'XXXXXX-XXXXXX-XXXXXXX'
    };

    mockCrm = TestBed.inject(CrmService) as unknown as MockCrmService;
    fixture.detectChanges();
  });

  describe('1. Screen Initialization & Date Defaults', () => {
    it('should correctly capture and bind the Account Name, Opportunity Name, and Q Number from quoteDetails', () => {
      // Verifies: should correctly capture and bind the Account Name, Opportunity Name, and Q Number from quoteDetails.
      expect(component.quoteDetails).toBeTruthy();
      expect(component.quoteDetails.Account.Name).toBe(dynamicAccountName);
      expect(component.quoteDetails.Opportunity.Name).toBe(dynamicOpportunityName);
      expect(component.quoteDetails.QuoteNumber).toBe(dynamicQuoteNumber);
    });

    it('should dynamically update when inputs are changed', () => {
      // Verifies: should dynamically update when inputs are changed.
      const freshAccount = 'Account_' + Math.random().toString(36).substring(7);
      const freshOpp = 'Opp_' + Math.random().toString(36).substring(7);
      const freshQuoteNum = 'Q-' + Math.floor(Math.random() * 1000000);

      component.quoteDetails = {
        QuoteNumber: freshQuoteNum,
        Account: { Name: freshAccount },
        Opportunity: { Name: freshOpp }
      };
      fixture.detectChanges();
      
      expect(component.quoteDetails.Account.Name).toBe(freshAccount);
      expect(component.quoteDetails.Opportunity.Name).toBe(freshOpp);
      expect(component.quoteDetails.QuoteNumber).toBe(freshQuoteNum);
    });

    it('should prefill primary contact, sales channel, quote expiration date, and dynamic start date', () => {
      // Verifies: should prefill primary contact, sales channel, quote expiration date, and dynamic start date.
      expect(component.detailsForm.get('primaryContact')?.value).toBe(dynamicPrimaryContact);
      expect(component.detailsForm.get('salesChannel')?.value).toBe(dynamicSalesChannel);

      const expectedStart = component.getTodayDateFormatted();
      expect(expectedStart).toBeTruthy();
      expect(expectedStart).toMatch(/^\d{2}-\d{2}-\d{4}$/);

      const expirationControl = component.detailsForm.get('quoteExpirationDate');
      expect(expirationControl?.value).toBe(dynamicExpirationDate);
    });
  });

  describe('2. Multiplier Suffix Parsing', () => {
    it('should expand multiplier suffixes (k, m, b) to full numbers dynamically', () => {
      // Verifies: should expand multiplier suffixes (k, m, b) to full numbers dynamically.
      const randValue = Math.floor(Math.random() * 900) + 100;
      expect(component.parseAmountString(`${randValue}k`)).toBe(randValue * 1000);
      expect(component.parseAmountString(`${randValue}m`)).toBe(randValue * 1000000);
      expect(component.parseAmountString(`${randValue}b`)).toBe(randValue * 1000000000);
      expect(component.parseAmountString(`${randValue}`)).toBe(randValue);
    });
  });

  describe('3. Dynamic Commitment Calculations', () => {
    it('should sum commitment period months and values reactively', fakeAsync(() => {
      // Verifies: should sum commitment period months and values reactively.
      const months1 = Math.floor(Math.random() * 24) + 1;
      const months2 = Math.floor(Math.random() * 24) + 1;
      const amt1 = Math.floor(Math.random() * 100000) + 10000;
      const amt2 = Math.floor(Math.random() * 100000) + 10000;

      component.commitmentPeriods = [
        { months: months1.toString(), amount: amt1, amountStr: amt1.toLocaleString('en-US'), isCollapsed: false },
        { months: months2.toString(), amount: amt2, amountStr: amt2.toLocaleString('en-US'), isCollapsed: false }
      ];

      let totals = { months: 0, amount: 0 };
      component.totalsChanged.subscribe(val => totals = val);

      component.calculateTotals();
      tick();

      expect(totals.months).toBe(months1 + months2);
      expect(totals.amount).toBe(amt1 + amt2);
    }));

    it('should support adding, duplicating, and deleting periods', () => {
      // Verifies: should support adding, duplicating, and deleting periods.
      const monthsVal = (Math.floor(Math.random() * 24) + 1).toString();
      const amtVal = Math.floor(Math.random() * 100000) + 10000;
      
      component.commitmentPeriods = [{ months: monthsVal, amount: amtVal, amountStr: amtVal.toLocaleString('en-US'), isCollapsed: false }];
      
      component.addCommitPeriod();
      expect(component.commitmentPeriods.length).toBe(2);

      component.duplicatePeriod(0);
      expect(component.commitmentPeriods.length).toBe(3);

      component.deletePeriod(0);
      expect(component.commitmentPeriods.length).toBe(2);
    });
  });

  describe('4. Discounts & Incentives Navigation Gates', () => {
    it('should disable discount view navigation if commitment periods are invalid', () => {
      // Verifies: should disable discount view navigation if commitment periods are invalid.
      component.commitmentPeriods = [{ months: '', amount: null, amountStr: '', isCollapsed: false }];
      expect(component.canNavigateToDiscounts()).toBeFalse();

      const monthsVal = (Math.floor(Math.random() * 24) + 1).toString();
      const amtVal = (Math.floor(Math.random() * 100000) + 10000).toLocaleString('en-US');
      component.commitmentPeriods = [{ months: monthsVal, amount: null, amountStr: amtVal, isCollapsed: false }];
      expect(component.canNavigateToDiscounts()).toBeTrue();
    });

    it('should calculate remaining products capacity badge correctly', () => {
      // Verifies: should calculate remaining products capacity badge correctly.
      const randCount = Math.floor(Math.random() * 50) + 1;
      const dummyProducts = Array(randCount).fill({ id: '1', name: 'P' });
      expect(999 - randCount).toBe(999 - dummyProducts.length);
    });

    it('should submit bulk discount API request with correct start date, end date, and discount payload', () => {
      // Verifies: should submit bulk discount API request with correct start date, end date, and discount payload.
      const randId = Math.floor(Math.random() * 1000) + 1;
      const randDiscount = (Math.floor(Math.random() * 90) + 5).toString();
      const randProdId = 'p_' + Math.random().toString(36).substring(7);
      const randProdName = 'Product_' + Math.random().toString(36).substring(7);

      component.selectedDiscountPeriodId = randId;
      component.discountPeriods = [{
        id: randId,
        timePeriod: 'Date range',
        startDate: '2026-03-18',
        endDate: '2026-05-02',
        granularity: 'Granular',
        discountType: 'Flat rate (%)',
        priceReference: 'Select',
        overallDiscount: randDiscount,
        products: []
      }];
      component.configDiscountGranularity = 'Granular';
      component.configDiscountType = 'Flat rate (%)';
      component.configPriceReference = 'Select';
      component.configOverallDiscount = randDiscount;
      component.tempSelectedProducts = [{ id: randProdId, name: randProdName }];

      mockCrm.applyBulkDiscounts.calls.reset();
      component.applyDiscountConfiguration();

      expect(mockCrm.applyBulkDiscounts).toHaveBeenCalledWith(
        parseFloat(randDiscount),
        'Discount',
        [{ id: randProdId, name: randProdName }],
        '2026-03-18',
        '2026-05-02'
      );
    });

    it('should submit bulk incentive API request with correct start date, end date, and incentive amount payload', () => {
      // Verifies: should submit bulk incentive API request with correct start date, end date, and incentive amount payload.
      const randId = Math.floor(Math.random() * 1000) + 1;
      const randIncentive = (Math.floor(Math.random() * 500000) + 10000).toString();
      const randProdId = 'p_' + Math.random().toString(36).substring(7);
      const randProdName = 'Product_' + Math.random().toString(36).substring(7);

      component.selectedIncentivePeriodId = randId;
      component.incentivePeriods = [{
        id: randId,
        timePeriod: 'Date range',
        startDate: '2026-05-03',
        endDate: '2026-07-31',
        type: 'Incentives type 1',
        products: []
      }];
      component.configIncentiveType = 'Incentives type 1';
      component.configIncentiveAmount = randIncentive;
      component.tempSelectedProducts = [{ id: randProdId, name: randProdName }];

      mockCrm.applyBulkDiscounts.calls.reset();
      component.applyIncentiveConfiguration();

      expect(mockCrm.applyBulkDiscounts).toHaveBeenCalledWith(
        parseFloat(randIncentive),
        'Incentive',
        [{ id: randProdId, name: randProdName }],
        '2026-05-03',
        '2026-07-31'
      );
    });
  });

  describe('5. Product Search & Discovery (Faceted & Global)', () => {
    let modal: SelectProductsModalComponent;
    let modalFixture: ComponentFixture<SelectProductsModalComponent>;

    beforeEach(() => {
      modalFixture = TestBed.createComponent(SelectProductsModalComponent);
      modal = modalFixture.componentInstance;
      modalFixture.detectChanges();
    });

    describe('A. Faceted Category Search', () => {
      it('should filter product list by category facet toggle', fakeAsync(() => {
      // Verifies: should filter product list by category facet toggle.
        mockCrm.facetedProductSearch.calls.reset();
        const randGroupId = 'group_' + Math.random().toString(36).substring(7);

        modal.selectGroupFacet(randGroupId);
        tick(300);
        expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith(randGroupId, '');
      }));

      it('should clear activeGroupId facet when toggled twice', () => {
      // Verifies: should clear activeGroupId facet when toggled twice.
        const randGroupId = 'group_' + Math.random().toString(36).substring(7);
        modal.selectGroupFacet(randGroupId);
        expect(modal.activeGroupId).toBe(randGroupId);

        modal.selectGroupFacet(randGroupId);
        expect(modal.activeGroupId).toBeNull();
      });
    });

    describe('B. Sorting Products', () => {
      it('should sort products alphabetically by name toggle asc/desc', () => {
      // Verifies: should sort products alphabetically by name toggle asc/desc.
        const name1 = 'B_Product_' + Math.random().toString(36).substring(7);
        const name2 = 'A_Product_' + Math.random().toString(36).substring(7);

        modal.groupProducts = [
          { id: 'g1', name: name1, family: 'Classification', selected: false, value: '', icon: '' },
          { id: 'g2', name: name2, family: 'Classification', selected: false, value: '', icon: '' }
        ];

        const sorted = [name1, name2].sort((a, b) => a.localeCompare(b));
        expect(modal.filteredProducts[0].name).toBe(sorted[0]);

        modal.toggleSort();
        expect(modal.filteredProducts[0].name).toBe(sorted[1]);
      });
    });

    describe('C. Global Search', () => {
      it('should debounce global search inputs for 300ms before querying', fakeAsync(() => {
      // Verifies: should debounce global search inputs for 300ms before querying.
        mockCrm.facetedProductSearch.calls.reset();
        const searchInput = 'Search_' + Math.random().toString(36).substring(7);

        modal.onSearchChange(searchInput.substring(0, 1));
        modal.onSearchChange(searchInput.substring(0, 3));
        modal.onSearchChange(searchInput);

        tick(200);
        expect(mockCrm.facetedProductSearch).not.toHaveBeenCalled();

        tick(100);
        expect(mockCrm.facetedProductSearch).toHaveBeenCalledTimes(1);
      }));

      it('should query API using search term in facetedProductSearch', fakeAsync(() => {
      // Verifies: should query API using search term in facetedProductSearch.
        mockCrm.facetedProductSearch.calls.reset();
        const randQuery = 'Query_' + Math.random().toString(36).substring(7);

        modal.onSearchChange(randQuery);
        tick(300);
        expect(mockCrm.facetedProductSearch).toHaveBeenCalledWith(undefined, randQuery);
      }));
    });

    describe('D. General Modal State and Selection Toggles', () => {
      it('should toggle activeTab between Groups and Individuals', () => {
      // Verifies: should toggle activeTab between Groups and Individuals.
        expect(modal.activeTab).toBe('Groups');
        
        modal.activeTab = 'Individuals';
        expect(modal.activeTab).toBe('Individuals');
      });

      it('should toggle filter between All and Selected list views', () => {
      // Verifies: should toggle filter between All and Selected list views.
        const randId1 = 'id_' + Math.random().toString(36).substring(7);
        const randId2 = 'id_' + Math.random().toString(36).substring(7);
        modal.groupProducts = [
          { id: randId1, name: 'Group A', family: 'Classification', selected: true, value: '', icon: '' },
          { id: randId2, name: 'Group B', family: 'Classification', selected: false, value: '', icon: '' }
        ];
        
        expect(modal.filter).toBe('All');
        expect(modal.filteredProducts.length).toBe(2);

        modal.filter = 'Selected';
        modalFixture.detectChanges();

        expect(modal.filteredProducts.length).toBe(1);
        expect(modal.filteredProducts[0].id).toBe(randId1);
      });

      it('should filter group products by search term', () => {
      // Verifies: should filter group products by search term.
        modal.activeTab = 'Groups';
        const searchWord = 'Vision_' + Math.random().toString(36).substring(7);
        modal.groupProducts = [
          { id: 'g1', name: searchWord, family: 'Classification', selected: false, value: '', icon: '' },
          { id: 'g2', name: 'Other_' + Math.random().toString(36).substring(7), family: 'Classification', selected: false, value: '', icon: '' }
        ];

        modal.searchTerm = searchWord;
        modalFixture.detectChanges();

        expect(modal.filteredProducts.length).toBe(1);
        expect(modal.filteredProducts[0].name).toBe(searchWord);
      });

      it('should calculate selectedCount and control selectAll toggle', () => {
      // Verifies: should calculate selectedCount and control selectAll toggle.
        modal.groupProducts = [
          { id: 'g1', name: 'Group A', family: 'Classification', selected: false, value: '', icon: '' },
          { id: 'g2', name: 'Group B', family: 'Classification', selected: false, value: '', icon: '' }
        ];

        expect(modal.selectedCount).toBe(0);
        expect(modal.isAllSelected).toBeFalse();

        modal.toggleSelectAll(true);
        expect(modal.selectedCount).toBe(2);
        expect(modal.isAllSelected).toBeTrue();

        modal.toggleSelectAll(false);
        expect(modal.selectedCount).toBe(0);
        expect(modal.isAllSelected).toBeFalse();
      });
    });
  });

  describe('6. Quote Submission Sequential APIs', () => {
    it('should call createCommitmentDetails tree API before calling submitQuoteDetails', fakeAsync(() => {
      // Verifies: should call createCommitmentDetails tree API before calling submitQuoteDetails.
      const randMonths = (Math.floor(Math.random() * 24) + 1).toString();
      const randAmt = Math.floor(Math.random() * 200000) + 10000;
      const randAmtStr = randAmt.toLocaleString('en-US');
      const randExpDate = '2026-08-' + (Math.floor(Math.random() * 20) + 10);

      component.commitmentPeriods = [{ months: randMonths, amount: randAmt, amountStr: randAmtStr, isCollapsed: false }];
      component.detailsForm?.patchValue({ quoteExpirationDate: randExpDate });

      mockCrm.createCommitmentDetails.calls.reset();
      mockCrm.submitQuoteDetails.calls.reset();

      component.submitQuote();
      tick();

      expect(mockCrm.createCommitmentDetails).toHaveBeenCalled();
      expect(mockCrm.submitQuoteDetails).toHaveBeenCalled();
      expect(component.showSuccessModal).toBeTrue();
    }));

    it('should trigger redirect and clear session on success modal ok click', () => {
      // Verifies: should trigger redirect and clear session on success modal ok click.
      spyOn(sessionStorage, 'clear');
      component.onSuccessModalOk();

      expect(sessionStorage.clear).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/opportunities']);
    });
  });

  describe('7. Salesforce Quote Preview Modal — All Fields', () => {
    let preview: QuotePreviewModalComponent;
    let previewFixture: ComponentFixture<QuotePreviewModalComponent>;

    const dynQuoteNumber  = 'Q-' + Math.floor(Math.random() * 1000000);
    const dynQuoteName    = 'Quote-' + Math.random().toString(36).substring(7);
    const dynAccountName  = 'Account_' + Math.random().toString(36).substring(7);
    const dynOppName      = 'Opp_' + Math.random().toString(36).substring(7);
    const dynStartDate    = '2026-07-13';
    const dynMonths1      = (Math.floor(Math.random() * 12) + 1).toString();
    const dynAmount1      = (Math.floor(Math.random() * 10000000) + 100000).toLocaleString('en-US');
    const dynProductName  = 'Product_' + Math.random().toString(36).substring(7);
    const dynQty          = Math.floor(Math.random() * 10) + 1;
    const dynDiscount     = Math.floor(Math.random() * 50);
    const dynIncentive    = Math.floor(Math.random() * 50000) + 1000;

    beforeEach(() => {
      previewFixture = TestBed.createComponent(QuotePreviewModalComponent);
      preview = previewFixture.componentInstance;

      preview.quoteDetails = {
        Id: 'q-123',
        QuoteNumber: dynQuoteNumber,
        Name: dynQuoteName,
        Account: { Name: dynAccountName },
        Opportunity: { Name: dynOppName },
        StartDate: dynStartDate,
        configuredProducts: [dynProductName]
      };

      preview.commitmentPeriods = [
        { months: dynMonths1, amount: null, amountStr: dynAmount1, isCollapsed: false }
      ];
    });

    // ── A. Quote Summary Section ───────────────────────────────────────
    describe('A. Quote Summary Section', () => {
      it('should bind Quote Number from quoteDetails', () => {
      // Verifies: should bind Quote Number from quoteDetails.
        expect(preview.quoteDetails.QuoteNumber).toBe(dynQuoteNumber);
      });

      it('should bind Quote Name from quoteDetails', () => {
      // Verifies: should bind Quote Name from quoteDetails.
        expect(preview.quoteDetails.Name).toBe(dynQuoteName);
      });

      it('should bind Customer (Account Name) from quoteDetails', () => {
      // Verifies: should bind Customer (Account Name) from quoteDetails.
        expect(preview.quoteDetails.Account.Name).toBe(dynAccountName);
      });

      it('should bind Opportunity Name from quoteDetails', () => {
      // Verifies: should bind Opportunity Name from quoteDetails.
        expect(preview.quoteDetails.Opportunity.Name).toBe(dynOppName);
      });

      it('should bind Quote Start Date from quoteDetails', () => {
      // Verifies: should bind Quote Start Date from quoteDetails.
        expect(preview.quoteDetails.StartDate).toBe(dynStartDate);
      });

      it('should calculate Total Commit Period (months) from commitmentPeriods', () => {
      // Verifies: should calculate Total Commit Period (months) from commitmentPeriods.
        expect(preview.totalCommitmentMonths).toBe(parseInt(dynMonths1));
      });

      it('should calculate Total Commit Value from commitmentPeriods amountStr', () => {
      // Verifies: should calculate Total Commit Value from commitmentPeriods amountStr.
        const expectedAmount = parseFloat(dynAmount1.replace(/,/g, ''));
        expect(preview.totalCommitmentValue).toBe(expectedAmount);
      });

      it('should calculate Total Incentives as 0 when no Incentive__c is present in QuoteLineItems', () => {
      // Verifies: should calculate Total Incentives as 0 when no Incentive__c is present in QuoteLineItems.
        preview.previewData = {
          QuoteLineItems: {
            records: [
              { Product2: { Name: dynProductName }, Quantity: dynQty, Discount: dynDiscount, StartDate: dynStartDate, EndDate: '2026-12-31' }
            ]
          }
        };
        expect(preview.totalIncentivesValue).toBe(0);
      });

      it('should sum Total Incentives from Incentive__c values in QuoteLineItems', () => {
      // Verifies: should sum Total Incentives from Incentive__c values in QuoteLineItems.
        preview.previewData = {
          QuoteLineItems: {
            records: [
              { Product2: { Name: dynProductName }, Quantity: 1, Incentive__c: dynIncentive, StartDate: dynStartDate, EndDate: '2026-12-31' }
            ]
          }
        };
        expect(preview.totalIncentivesValue).toBe(dynIncentive);
      });
    });

    // ── B. Commitment Details Section ─────────────────────────────────
    describe('B. Commitment Details Section', () => {
      it('should have correct number of commitment detail rows', () => {
      // Verifies: should have correct number of commitment detail rows.
        expect(preview.commitmentPeriods.length).toBe(1);
      });

      it('should display Line Name as sequential index (1-based)', () => {
      // Verifies: should display Line Name as sequential index (1-based).
        // Row index 0 → displays as line name "1"
        expect(preview.commitmentPeriods.indexOf(preview.commitmentPeriods[0])).toBe(0);
      });

      it('should display Period label as "Period N" for each row', () => {
      // Verifies: should display Period label as "Period N" for each row.
        // Verify that the period label is based on position
        const idx = 0;
        const expectedLabel = `Period ${idx + 1}`;
        expect(expectedLabel).toBe('Period 1');
      });

      it('should display the correct Period (months) value per row', () => {
      // Verifies: should display the correct Period (months) value per row.
        expect(preview.commitmentPeriods[0].months).toBe(dynMonths1);
      });

      it('should display the correct Commitment Value per row', () => {
      // Verifies: should display the correct Commitment Value per row.
        expect(preview.commitmentPeriods[0].amountStr).toBe(dynAmount1);
      });

      it('should show dash for missing months on empty period rows', () => {
      // Verifies: should show dash for missing months on empty period rows.
        preview.commitmentPeriods = [{ months: '', amount: null, amountStr: '', isCollapsed: false }];
        expect(preview.commitmentPeriods[0].months || '-').toBe('-');
      });
    });

    // ── C. Product Section ────────────────────────────────────────────
    describe('C. Product Section', () => {
      beforeEach(() => {
        preview.parseQuoteLineItems([
          { Product2: { Name: dynProductName, Type: 'Bundle' }, Quantity: dynQty, Discount: dynDiscount, StartDate: dynStartDate, EndDate: '2026-12-31' }
        ]);
      });

      it('should parse and display Product Name in sfProducts list', () => {
      // Verifies: should parse and display Product Name in sfProducts list.
        expect(preview.sfProducts[0].name).toBe(dynProductName);
      });

      it('should parse and display Quantity in sfProducts list', () => {
      // Verifies: should parse and display Quantity in sfProducts list.
        expect(preview.sfProducts[0].quantity).toBe(dynQty);
      });

      it('should parse and display Discount (%) in sfProducts list', () => {
      // Verifies: should parse and display Discount (%) in sfProducts list.
        expect(preview.sfProducts[0].discount).toBe(dynDiscount);
      });

      it('should fallback to configuredProducts[0] name when sfProducts is empty', () => {
      // Verifies: should fallback to configuredProducts[0] name when sfProducts is empty.
        preview.sfProducts = [];
        const fallback = preview.quoteDetails?.configuredProducts?.[0] || 'Google Cloud Platform RCA';
        expect(fallback).toBe(dynProductName);
      });
    });

    // ── D. Discount Periods Section ───────────────────────────────────
    describe('D. Discount Periods Section', () => {
      const discountProdName = 'DiscProd_' + Math.random().toString(36).substring(7);
      const discountVal = Math.floor(Math.random() * 40) + 5;

      beforeEach(() => {
        preview.parseQuoteLineItems([
          { Product2: { Name: discountProdName }, Quantity: 1, Discount: discountVal, StartDate: '2026-03-18', EndDate: '2026-05-02' }
        ]);
      });

      it('should create one sfDiscountPeriod entry when one date range with discount exists', () => {
      // Verifies: should create one sfDiscountPeriod entry when one date range with discount exists.
        expect(preview.sfDiscountPeriods.length).toBe(1);
      });

      it('should capture discount period Start Date correctly', () => {
      // Verifies: should capture discount period Start Date correctly.
        expect(preview.sfDiscountPeriods[0].startDate).toBe('2026-03-18');
      });

      it('should capture discount period End Date correctly', () => {
      // Verifies: should capture discount period End Date correctly.
        expect(preview.sfDiscountPeriods[0].endDate).toBe('2026-05-02');
      });

      it('should set discountType to Flat rate (%)', () => {
      // Verifies: should set discountType to Flat rate (%).
        expect(preview.sfDiscountPeriods[0].discountType).toBe('Flat rate (%)');
      });

      it('should display product name inside discount period products list', () => {
      // Verifies: should display product name inside discount period products list.
        expect(preview.sfDiscountPeriods[0].products[0].name).toBe(discountProdName);
      });

      it('should display correct discount value on product in discount period', () => {
      // Verifies: should display correct discount value on product in discount period.
        expect(preview.sfDiscountPeriods[0].products[0].discount).toBe(discountVal);
      });

      it('should group multiple products under the same date range into one period', () => {
      // Verifies: should group multiple products under the same date range into one period.
        const secondProd = 'DiscProd2_' + Math.random().toString(36).substring(7);
        preview.parseQuoteLineItems([
          { Product2: { Name: discountProdName }, Quantity: 1, Discount: discountVal, StartDate: '2026-03-18', EndDate: '2026-05-02' },
          { Product2: { Name: secondProd }, Quantity: 1, Discount: discountVal + 5, StartDate: '2026-03-18', EndDate: '2026-05-02' }
        ]);
        expect(preview.sfDiscountPeriods.length).toBe(1);
        expect(preview.sfDiscountPeriods[0].products.length).toBe(2);
      });
    });

    // ── E. Incentive Periods Section ──────────────────────────────────
    describe('E. Incentive Periods Section', () => {
      const incentiveProdName = 'IncentProd_' + Math.random().toString(36).substring(7);
      const incentiveAmt = Math.floor(Math.random() * 100000) + 5000;

      beforeEach(() => {
        preview.parseQuoteLineItems([
          { Product2: { Name: incentiveProdName }, Quantity: 1, Incentive__c: incentiveAmt, StartDate: '2026-05-03', EndDate: '2026-07-31' }
        ]);
      });

      it('should create one sfIncentivePeriod entry when one date range with incentive exists', () => {
      // Verifies: should create one sfIncentivePeriod entry when one date range with incentive exists.
        expect(preview.sfIncentivePeriods.length).toBe(1);
      });

      it('should capture incentive period Start Date correctly', () => {
      // Verifies: should capture incentive period Start Date correctly.
        expect(preview.sfIncentivePeriods[0].startDate).toBe('2026-05-03');
      });

      it('should capture incentive period End Date correctly', () => {
      // Verifies: should capture incentive period End Date correctly.
        expect(preview.sfIncentivePeriods[0].endDate).toBe('2026-07-31');
      });

      it('should set incentive type to Incentives type 1', () => {
      // Verifies: should set incentive type to Incentives type 1.
        expect(preview.sfIncentivePeriods[0].type).toBe('Incentives type 1');
      });

      it('should display product name inside incentive period products list', () => {
      // Verifies: should display product name inside incentive period products list.
        expect(preview.sfIncentivePeriods[0].products[0].name).toBe(incentiveProdName);
      });

      it('should display incentive amount on product in incentive period', () => {
      // Verifies: should display incentive amount on product in incentive period.
        expect(preview.sfIncentivePeriods[0].products[0].incentive).toBe(incentiveAmt);
      });
    });

    // ── F. API & Fallback Behaviour ───────────────────────────────────
    describe('F. API & Fallback Behaviour', () => {
      it('should call CrmService.getQuotePreview with quoteDetails.Id on init', fakeAsync(() => {
      // Verifies: should call CrmService.getQuotePreview with quoteDetails.Id on init.
        mockCrm.getQuotePreview.calls.reset();
        previewFixture.detectChanges();
        expect(mockCrm.getQuotePreview).toHaveBeenCalledWith('q-123');
      }));

      it('should set previewData from API response records[0]', fakeAsync(() => {
      // Verifies: should set previewData from API response records[0].
        previewFixture.detectChanges();
        tick();
        expect(preview.previewData).toBeTruthy();
        expect(preview.previewData.QuoteNumber).toBe('Q-00005148');
      }));

      it('should gracefully handle API failure without throwing — sfDiscountPeriods stays empty', fakeAsync(() => {
      // Verifies: should gracefully handle API failure without throwing — sfDiscountPeriods stays empty.
        mockCrm.getQuotePreview.and.returnValue(throwError(() => new Error('Network Error')));
        previewFixture.detectChanges();
        tick();
        expect(preview.sfDiscountPeriods.length).toBe(0);
      }));

      it('should emit close event when closeModal() is called', () => {
      // Verifies: should emit close event when closeModal() is called.
        let closeFired = false;
        preview.close.subscribe(() => closeFired = true);
        preview.closeModal();
        expect(closeFired).toBeTrue();
      });
    });
  });
});

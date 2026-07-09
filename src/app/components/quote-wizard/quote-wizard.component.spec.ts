import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { QuoteWizardComponent } from './quote-wizard.component';
import { CrmService } from '../../services/crm.service';
import { PeriodService } from '../../services/period.service';

describe('QuoteWizardComponent (Subscription Flow & Configurations)', () => {
  let component: QuoteWizardComponent;
  let fixture: ComponentFixture<QuoteWizardComponent>;
  let mockCrmService: jasmine.SpyObj<CrmService>;
  let mockPeriodService: jasmine.SpyObj<PeriodService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockQuoteDetails = {
    quoteNumber: 'Q-1234',
    opportunityId: 'opp-98124',
    opportunityName: 'Opportunity Name 1',
    primaryContact: 'Sarah Connor',
    salesChannel: 'Direct',
    configuredProducts: ['Looker Core'],
    billingFrequency: 'Annual in Advance Anniversary',
    termStartsOn: 'Fixed Start Date',
    termStartDate: '2026-02-01',
    termEndDate: '2029-01-31',
    termMonths: 36,
    paymentAccount: {
      name: 'XXX XXXXXX',
      billingAccount: 'XXXXXX-XXXXXX-XXXXXXX',
      paymentAccountId: 'XXXXXX-XXXXXX-XXXXXXX',
      billingAddress: '5920 Niagara River Parkway, Niagara Falls ON L2E 6X8 CA',
      billingCurrency: 'CAD'
    }
  };

  const mockPicklists = {
    billingFrequencies: [
      'Quarterly in Advance Anniversary',
      'Annual in Advance Anniversary',
      'Monthly in Arrears',
      'Quarterly in Advance',
      'Annual in Advance'
    ],
    termStartsOnOptions: [
      'Fixed Start Date',
      'Upon Provisioning',
      'Customer Signature Date'
    ],
    operationTypes: ['New', 'Upsell', 'Renewal']
  };

  beforeEach(async () => {
    mockCrmService = jasmine.createSpyObj('CrmService', ['getQuoteDetails', 'getPicklists', 'submitQuoteDetails']);
    mockPeriodService = jasmine.createSpyObj('PeriodService', ['generateYearlyPeriods', 'generateCustomPeriods', 'validatePeriods', 'getDefaultChildProducts']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Set up default localStorage/sessionStorage spies or values
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'selectedQuoteId') return 'quote-1234';
      if (key === 'selectedOpportunityId') return 'opp-98124';
      if (key === 'selectedOpportunityName') return 'Opportunity Name 1';
      return null;
    });
    spyOn(window, 'confirm');

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, QuoteWizardComponent],
      providers: [
        FormBuilder,
        { provide: CrmService, useValue: mockCrmService },
        { provide: PeriodService, useValue: mockPeriodService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    mockCrmService.getQuoteDetails.and.returnValue(of(mockQuoteDetails));
    mockCrmService.getPicklists.and.returnValue(of(mockPicklists));
    mockPeriodService.validatePeriods.and.returnValue({ isValid: true, errors: [] });
    mockPeriodService.getDefaultChildProducts.and.returnValue([
      { name: 'Standard User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Developer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Viewer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Non-prod', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 }
    ]);

    fixture = TestBed.createComponent(QuoteWizardComponent);
    component = fixture.componentInstance;
  });

  describe('1. Screen Initialization & Loading APIs', () => {
    it('should call getQuoteDetails and getPicklists on init using cached Quote ID', () => {
      fixture.detectChanges(); // Trigger ngOnInit

      expect(sessionStorage.getItem).toHaveBeenCalledWith('selectedQuoteId');
      expect(mockCrmService.getQuoteDetails).toHaveBeenCalledWith('quote-1234');
      expect(mockCrmService.getPicklists).toHaveBeenCalled();
    });

    it('should prefill Tab 1 Form details from Quote and Opportunity details', () => {
      fixture.detectChanges();

      expect(component.detailsForm.get('primaryContact')?.value).toBe('Sarah Connor');
      expect(component.detailsForm.get('salesChannel')?.value).toBe('Direct');
      expect(component.detailsForm.get('operationType')?.value).toBe('New');
      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-02-01');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2029-01-31');
    });

    it('should populate picklist select elements with options loaded from the API', () => {
      fixture.detectChanges();

      expect(component.billingFrequencyOptions).toEqual(mockPicklists.billingFrequencies);
      expect(component.termStartsOnOptions).toEqual(mockPicklists.termStartsOnOptions);
      expect(component.operationTypeOptions).toEqual(mockPicklists.operationTypes);
    });

    it('should default quote expiration date to 45 days from creation', () => {
      fixture.detectChanges();
      const expirationDateControl = component.detailsForm.get('quoteExpirationDate');
      expect(expirationDateControl?.value).toBeTruthy();
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 45);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      expect(expirationDateControl?.value).toBe(expectedStr);
    });

    it('should render the Payment Account Card correctly with purple primary badge', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      
      const accountName = element.querySelector('.payment-account-name');
      const billingAccount = element.querySelector('.billing-account-number');
      const primaryBadge = element.querySelector('.primary-badge');
      
      expect(accountName?.textContent?.trim()).toBe('XXX XXXXXX');
      expect(billingAccount?.textContent?.trim()).toContain('XXXXXX-XXXXXX-XXXXXXX');
      expect(primaryBadge).toBeTruthy();
      expect(primaryBadge?.classList.contains('bg-purple-100')).toBeTrue();
    });
  });

  describe('2. Date Synchronization & Bi-directional Sync', () => {
    it('should sync Term Start/End Dates in Tab 1 with Subscription Start/End Dates in Tab 2', () => {
      fixture.detectChanges();

      // Change Start Date in Tab 1
      component.detailsForm.get('termStartDate')?.setValue('2026-03-01');
      fixture.detectChanges();
      
      expect(component.subscriptionStartDate).toBe('2026-03-01');

      // Change End Date in Tab 1
      component.detailsForm.get('termEndDate')?.setValue('2029-02-28');
      fixture.detectChanges();
      
      expect(component.subscriptionEndDate).toBe('2029-02-28');
    });

    it('should update Tab 1 Term dates if Subscription dates are changed in Tab 2', () => {
      fixture.detectChanges();

      component.updateSubscriptionDates('2026-04-01', '2029-03-31');
      fixture.detectChanges();

      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-04-01');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2029-03-31');
    });
  });

  describe('3. Empty State Handling', () => {
    it('should render empty state message and create subscription periods button when no periods exist', () => {
      component.periods = [];
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const emptyState = element.querySelector('.empty-state-container');
      const createBtn = element.querySelector('.create-periods-btn');

      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('You can choose to create yearly or a custom period');
      expect(createBtn).toBeTruthy();
    });
  });

  describe('4. Period Configuration Generation (Modal & Logic)', () => {
    it('should launch the Create Subscription Periods modal when clicking create button', () => {
      fixture.detectChanges();
      expect(component.showCreatePeriodsModal).toBeFalse();

      component.openCreatePeriodsModal();
      expect(component.showCreatePeriodsModal).toBeTrue();
    });

    it('should generate N yearly periods based on overall term and bound them to max 1 year', () => {
      fixture.detectChanges();
      const generatedPeriods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: '', discount: 0, childProducts: [] },
        { name: 'Period 2', startDate: '2027-02-01', endDate: '2028-01-31', platformProduct: '', discount: 0, childProducts: [] },
        { name: 'Period 3', startDate: '2028-02-01', endDate: '2029-01-31', platformProduct: '', discount: 0, childProducts: [] }
      ];
      mockPeriodService.generateYearlyPeriods.and.returnValue(generatedPeriods);

      component.createPeriods('Yearly');
      
      expect(mockPeriodService.generateYearlyPeriods).toHaveBeenCalledWith('2026-02-01', '2029-01-31');
      expect(component.periods.length).toBe(3);
      expect(component.periods[0].endDate).toBe('2027-01-31');
    });

    it('should allow manually adding and configuring custom period start/end dates', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: '', discount: 0, childProducts: [] }
      ];
      
      component.addPeriod();
      expect(component.periods.length).toBe(2);
      expect(component.periods[1].name).toBe('Period 2');
    });

    it('should update overall subscription end date when adding a period in yearly mode', () => {
      fixture.detectChanges();
      component.generationMode = 'Yearly';
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];

      component.addPeriod();
      fixture.detectChanges();

      // Automatically shifts the end date out by 12 months (total 2 periods -> Jan 31, 2028)
      expect(component.subscriptionEndDate).toBe('2028-01-31');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2028-01-31');
    });
  });

  describe('5. Child Products & Ramp Table Validations', () => {
    it('should require Region, GCP Project ID, and Looker Instance ID if child product quantity is greater than 0', () => {
      fixture.detectChanges();
      component.periods = [
        {
          name: 'Period 1',
          startDate: '2026-02-01',
          endDate: '2027-01-31',
          platformProduct: 'Standard Annual Subscription',
          discount: 0,
          childProducts: [
            { name: 'Standard User', quantity: 5, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 }
          ]
        }
      ];

      mockPeriodService.validatePeriods.and.returnValue({
        isValid: false,
        errors: [{ message: 'GCP Project ID is required when quantity is greater than 0.' }]
      });

      const validationResult = component.validateAllPeriods();
      expect(validationResult.isValid).toBeFalse();
      expect(validationResult.errors[0].message).toContain('GCP Project ID is required');
    });

    it('should bypass region/IDs validation if child product quantity is 0', () => {
      fixture.detectChanges();
      component.periods = [
        {
          name: 'Period 1',
          startDate: '2026-02-01',
          endDate: '2027-01-31',
          platformProduct: 'Standard Annual Subscription',
          discount: 0,
          childProducts: [
            { name: 'Standard User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 }
          ]
        }
      ];

      mockPeriodService.validatePeriods.and.returnValue({ isValid: true, errors: [] });

      const validationResult = component.validateAllPeriods();
      expect(validationResult.isValid).toBeTrue();
    });

    it('should fail validation if there are gaps or overlaps between periods', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] },
        { name: 'Period 2', startDate: '2027-02-05', endDate: '2028-02-04', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] } // Gap here
      ];

      mockPeriodService.validatePeriods.and.returnValue({
        isValid: false,
        errors: [{ message: 'Period dates must be contiguous. Please correct the gaps.' }]
      });

      const validation = component.validateAllPeriods();
      expect(validation.isValid).toBeFalse();
      expect(validation.errors[0].message).toContain('Period dates must be contiguous');
    });
  });

  describe('6. Quote Submission', () => {
    it('should execute CrmService submitQuoteDetails and navigate to opportunities on successful submission', fakeAsync(() => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2029-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      mockCrmService.submitQuoteDetails.and.returnValue(of({ success: true }));

      component.submitQuote();
      tick();

      expect(mockCrmService.submitQuoteDetails).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/opportunities']);
    }));

    it('should disable submit button when form is invalid or no periods are configured', () => {
      fixture.detectChanges();
      component.periods = []; // No periods
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const submitBtn: HTMLButtonElement | null = element.querySelector('button[type="submit"]') || element.querySelector('.submit-btn');
      
      expect(submitBtn?.disabled).toBeTrue();
    });
  });

  describe('7. Edge Cases & Reset Logic', () => {
    it('should show confirm dialog and reset configured periods if Term Start Date is modified in Tab 1', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      
      // Spy on confirm to return true (user accepts changes)
      (window.confirm as jasmine.Spy).and.returnValue(true);

      component.onTermStartDateChange('2026-03-01');
      fixture.detectChanges();

      expect(window.confirm).toHaveBeenCalledWith(
        'Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?'
      );
      expect(component.periods.length).toBe(0); // Periods reset
    });

    it('should keep existing periods if user rejects the Term Start Date change confirmation', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];

      // Spy on confirm to return false (user rejects changes)
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.onTermStartDateChange('2026-03-01');
      fixture.detectChanges();

      expect(component.periods.length).toBe(1); // Not reset
      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-02-01'); // Restored to previous date
    });
  });
});

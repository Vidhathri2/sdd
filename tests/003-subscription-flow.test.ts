import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { SubscriptionFlowComponent } from '../src/app/components/subscription-flow/subscription-flow.component';
import { CrmService } from '../src/app/services/crm.service';
import { PeriodService } from '../src/app/services/period.service';

describe('SubscriptionFlowComponent (Subscription Flow & Configurations)', () => {
  let component: SubscriptionFlowComponent;
  let fixture: ComponentFixture<SubscriptionFlowComponent>;
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
    operationTypes: ['New', 'Upsell', 'Renewal'],
    regions: ['US', 'EU', 'APAC']
  };

  beforeEach(async () => {
    mockCrmService = jasmine.createSpyObj('CrmService', [
      'getQuoteDetails',
      'getPicklists',
      'submitQuoteDetails',
      'getBundleQuoteLineItems',
      'getProductDetails'
    ]);
    mockPeriodService = jasmine.createSpyObj('PeriodService', ['generateYearlyPeriods', 'generateCustomPeriods', 'validatePeriods', 'getDefaultChildProducts']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Spy on sessionStorage to return pre-cached Opportunity and Quote IDs
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'selectedQuoteId') return 'quote-1234';
      if (key === 'selectedOpportunityId') return 'opp-98124';
      if (key === 'selectedOpportunityName') return 'Opportunity Name 1';
      return null;
    });
    spyOn(window, 'confirm');

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, SubscriptionFlowComponent],
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
    mockCrmService.getBundleQuoteLineItems.and.returnValue(of({
      records: [
        {
          Id: 'mock-bundle-line-id',
          Product2Id: 'mock-bundle-product-id',
          Product2: { Name: 'Looker New RCA', Type: 'Bundle' },
          PricebookEntryId: 'mock-pbe-id'
        }
      ]
    }));
    mockCrmService.getProductDetails.and.returnValue(of({
      result: {
        id: 'mock-bundle-product-id',
        name: 'Looker New RCA',
        productComponentGroups: [
          {
            id: 'g-platform',
            name: 'Platform',
            components: [
              {
                id: 'comp-platform-std',
                name: 'Looker (Google Cloud core) Standard Platform Annual Subscription RCA',
                prices: [
                  { price: 5000.0, pricebookEntryId: 'pbe-plat-ann', pricingModel: { frequency: 'Annual' } },
                  { price: 500.0, pricebookEntryId: 'pbe-plat-mon', pricingModel: { frequency: 'Months' } }
                ]
              }
            ]
          },
          {
            id: 'g-users',
            name: 'Users',
            components: [
              {
                id: 'comp-user-std',
                name: 'Looker (Google Cloud core) Standard User Annual Subscription RCA',
                prices: [
                  { price: 150.0, pricebookEntryId: 'pbe-std-mon', pricingModel: { frequency: 'Months' } }
                ]
              },
              {
                id: 'comp-user-dev',
                name: 'Looker (Google Cloud core) Developer User Annual Subscription RCA',
                prices: [
                  { price: 100.0, pricebookEntryId: 'pbe-dev-mon', pricingModel: { frequency: 'Months' } }
                ]
              },
              {
                id: 'comp-user-view',
                name: 'Looker (Google Cloud core) Viewer User Annual Subscription RCA',
                prices: [
                  { price: 150.0, pricebookEntryId: 'pbe-view-mon', pricingModel: { frequency: 'Months' } }
                ]
              }
            ]
          }
        ]
      }
    }));
    mockPeriodService.validatePeriods.and.returnValue({ isValid: true, errors: [] });
    mockPeriodService.getDefaultChildProducts.and.returnValue([
      { name: 'Standard User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Developer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Viewer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Non-prod', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 }
    ]);

    fixture = TestBed.createComponent(SubscriptionFlowComponent);
    component = fixture.componentInstance;
  });

  describe('1. Screen Initialization & Loading APIs', () => {
    // Verifies that Quote details and picklist options APIs are loaded on initialization using the cached ID
    it('should call getQuoteDetails and getPicklists on init using cached Quote ID', () => {
      fixture.detectChanges();
      expect(sessionStorage.getItem).toHaveBeenCalledWith('selectedQuoteId');
      expect(mockCrmService.getQuoteDetails).toHaveBeenCalledWith('quote-1234');
      expect(mockCrmService.getPicklists).toHaveBeenCalled();
    });

    // Verifies that getBundleQuoteLineItems is called successfully with the correct Quote ID once getQuoteDetails resolves
    it('should call getBundleQuoteLineItems with the correct Quote ID on init', () => {
      fixture.detectChanges();
      expect(mockCrmService.getBundleQuoteLineItems).toHaveBeenCalledWith('quote-1234');
    });

    // Verifies that getProductDetails is called successfully with the correct bundle product ID once bundle items are loaded
    it('should call getProductDetails with the correct bundle product ID on init', () => {
      fixture.detectChanges();
      expect(mockCrmService.getProductDetails).toHaveBeenCalledWith('mock-bundle-product-id');
    });

    // Verifies that getQuoteDetails successfully retrieves quote details and maps values to component properties
    it('should successfully load quote details from getQuoteDetails API', () => {
      fixture.detectChanges();
      expect(component.quoteDetails).toEqual(mockQuoteDetails);
      expect(component.subscriptionStartDate).toBe('2026-02-01');
      expect(component.subscriptionEndDate).toBe('2029-01-31');
    });

    // Verifies that getPicklists successfully retrieves and maps picklist options to option arrays in component state
    it('should successfully load picklist options from getPicklists API', () => {
      fixture.detectChanges();
      expect(component.billingFrequencyOptions).toEqual(mockPicklists.billingFrequencies);
      expect(component.termStartsOnOptions).toEqual(mockPicklists.termStartsOnOptions);
      expect(component.operationTypeOptions).toEqual(mockPicklists.operationTypes);
      expect(component.regionOptions).toEqual(mockPicklists.regions);
    });

    // Verifies that the initial quote form values (dates, channel, contact) are prefilled inside the form controls
    it('should prefill Tab 1 Form details from Quote and Opportunity details', () => {
      fixture.detectChanges();
      expect(component.detailsForm.get('primaryContact')?.value).toBe('Sarah Connor');
      expect(component.detailsForm.get('salesChannel')?.value).toBe('Direct');
      expect(component.detailsForm.get('operationType')?.value).toBe('New');
      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-02-01');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2029-01-31');
    });

    // Verifies that the picklist dropdown arrays (including Billing Frequency, Term Starts On, Operation Type, and Region) are populated correctly from the picklist options API response
    it('should populate picklist select elements with options loaded from the API', () => {
      fixture.detectChanges();
      expect(component.billingFrequencyOptions).toEqual(mockPicklists.billingFrequencies);
      expect(component.termStartsOnOptions).toEqual(mockPicklists.termStartsOnOptions);
      expect(component.operationTypeOptions).toEqual(mockPicklists.operationTypes);
      expect(component.regionOptions).toEqual(mockPicklists.regions);
    });

    // Verifies that the quote expiration date control is pre-calculated to exactly 45 days in the future
    it('should default quote expiration date to 45 days from creation', () => {
      fixture.detectChanges();
      const expirationDateControl = component.detailsForm.get('quoteExpirationDate');
      expect(expirationDateControl?.value).toBeTruthy();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 45);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      expect(expirationDateControl?.value).toBe(expectedStr);
    });

    // Verifies that the payment account card is rendered with correct labels and a purple primary badge
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
    // Verifies that editing start and end dates in Tab 1 propagates values directly to Tab 2 boundaries
    it('should sync Term Start/End Dates in Tab 1 with Subscription Start/End Dates in Tab 2', () => {
      fixture.detectChanges();
      component.detailsForm.get('termStartDate')?.setValue('2026-03-01');
      fixture.detectChanges();
      expect(component.subscriptionStartDate).toBe('2026-03-01');
      component.detailsForm.get('termEndDate')?.setValue('2029-02-28');
      fixture.detectChanges();
      expect(component.subscriptionEndDate).toBe('2029-02-28');
    });

    // Verifies that updates made directly to subscription start and end dates in Tab 2 sync back to the Tab 1 form control objects
    it('should update Tab 1 Term dates if Subscription dates are changed in Tab 2', () => {
      fixture.detectChanges();
      component.updateSubscriptionDates('2026-04-01', '2029-03-31');
      fixture.detectChanges();
      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-04-01');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2029-03-31');
    });
  });

  describe('3. Empty State Handling', () => {
    // Verifies that the plans tab shows a clear empty callout panel when no periods have been configured yet
    it('should render empty state message and create subscription periods button when no periods exist', () => {
      component.periods = [];
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const emptyState = element.querySelector('.empty-state-container');
      const createBtn = element.querySelector('.create-periods-btn');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('You can choose to create yearly plans or for a custom period');
      expect(createBtn).toBeTruthy();
    });
  });

  describe('4. Period Configuration Generation (Modal & Logic)', () => {
    // Verifies that clicking the create button opens the modal component overlay by toggling the local boolean state
    it('should launch the Create Subscription Periods modal when clicking create button', () => {
      fixture.detectChanges();
      expect(component.showCreatePeriodsModal).toBeFalse();
      component.openCreatePeriodsModal();
      expect(component.showCreatePeriodsModal).toBeTrue();
    });

    // Verifies that Yearly mode generates consecutive yearly period bounds that cover the full term duration
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

    // Verifies that adding periods manually in Custom mode creates periods with blank/empty start and end dates
    it('should allow manually adding and configuring custom period start/end dates with empty values in Custom mode', () => {
      fixture.detectChanges();
      component.generationMode = 'Custom';
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: '', discount: 0, childProducts: [] }
      ];
      component.addPeriod();
      expect(component.periods.length).toBe(2);
      expect(component.periods[1].name).toBe('Period 2');
      expect(component.periods[1].startDate).toBe('');
      expect(component.periods[1].endDate).toBe('');
    });

    // Verifies that adding a period in Yearly mode automatically sets sequential dates and updates the header term dates correspondingly
    it('should update overall subscription end date when adding a period in yearly mode', () => {
      fixture.detectChanges();
      component.generationMode = 'Yearly';
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      component.addPeriod();
      fixture.detectChanges();
      expect(component.subscriptionEndDate).toBe('2028-01-31');
      expect(component.detailsForm.get('termEndDate')?.value).toBe('2028-01-31');
    });
  });

  describe('5. Child Products & Ramp Table Validations', () => {
    // Verifies that when a child product's quantity is greater than 0, GCP ID, Looker ID, and Region must be populated
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

    // Verifies that GCP/Looker metadata fields are bypassed from validation rules if product quantity is exactly 0
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

    // Verifies that validation fails if the periods configured contain gap offsets or overlapping date ranges
    it('should fail validation if there are gaps or overlaps between periods', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] },
        { name: 'Period 2', startDate: '2027-02-05', endDate: '2028-02-04', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
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
    // Verifies that submitQuoteDetails successfully submits the period details payload and opens the success modal
    it('should successfully submit quote with period configuration details via place API', fakeAsync(() => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2029-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      mockCrmService.submitQuoteDetails.and.returnValue(of({ success: true }));
      spyOn(sessionStorage, 'clear');
      component.submitQuote();
      tick();
      expect(mockCrmService.submitQuoteDetails).toHaveBeenCalled();
      expect(component.showSuccessModal).toBeTrue();
      component.onSuccessModalOk();
      expect(sessionStorage.clear).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/opportunities']);
    }));

    // Verifies that error messages are toasted on the screen when the submit quote transaction fails
    it('should show toast message with error message if API fails', fakeAsync(() => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2029-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      mockCrmService.submitQuoteDetails.and.returnValue(of({
        isSuccess: false,
        errorResponse: [
          { message: 'Required fields are missing: [PricebookEntryId]' }
        ]
      }));
      spyOn(component, 'showToast');
      component.submitQuote();
      tick();
      expect(component.showToast).toHaveBeenCalledWith('Required fields are missing: [PricebookEntryId]');
      expect(component.showSuccessModal).toBeFalse();
    }));

    // Verifies that the submit button in the wizard footer is disabled until periods are configured
    it('should disable submit button when form is invalid or no periods are configured', () => {
      fixture.detectChanges();
      component.periods = [];
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const submitBtn: HTMLButtonElement | null = element.querySelector('button[type="submit"]') || element.querySelector('.submit-btn');
      expect(submitBtn?.disabled).toBeTrue();
    });
  });

  describe('7. Edge Cases & Reset Logic', () => {
    // Verifies that changing start dates triggers a confirmation alert and clears all configured periods when confirmed
    it('should show confirm dialog and reset configured periods if Term Start Date is modified in Tab 1', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      (window.confirm as jasmine.Spy).and.returnValue(true);
      component.onTermStartDateChange('2026-03-01');
      fixture.detectChanges();
      expect(window.confirm).toHaveBeenCalledWith(
        'Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?'
      );
      expect(component.periods.length).toBe(0);
    });

    // Verifies that rejecting the date change confirmation dialog preserves existing configured periods and restores previous dates
    it('should keep existing periods if user rejects the Term Start Date change confirmation', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: 'Standard Annual Subscription', discount: 0, childProducts: [] }
      ];
      (window.confirm as jasmine.Spy).and.returnValue(false);
      component.onTermStartDateChange('2026-03-01');
      fixture.detectChanges();
      expect(component.periods.length).toBe(1);
      expect(component.detailsForm.get('termStartDate')?.value).toBe('2026-02-01');
    });
  });

  describe('8. Custom Quote Preview & Added Requirements (Salesforce RCA)', () => {
    // Verifies that the preview modal overlay visibility toggles correctly
    it('should toggle preview modal visibility correctly', () => {
      fixture.detectChanges();
      expect(component.showPreviewModal).toBeFalse();
      component.openPreviewModal();
      expect(component.showPreviewModal).toBeTrue();
      component.closePreviewModal();
      expect(component.showPreviewModal).toBeFalse();
    });

    // Verifies that order term duration labels are formatted correctly and are inclusive of the end date
    it('should format order term labels inclusive of end date', () => {
      fixture.detectChanges();
      expect(component.getOrderTermLabel('2026-07-13', '2026-07-22')).toBe('10 days');
      expect(component.getOrderTermLabel('2026-08-01', '2027-07-31')).toBe('12 months');
    });

    // Verifies that partial-month subscription fees are calculated using the calendar-inclusive days/31 formula
    it('should calculate subscription fees share correctly using days/31 formula for partial months', () => {
      fixture.detectChanges();
      const platformFee = component.calculateFeeValue(440, 1, 0, '2026-07-13', '2026-07-22');
      expect(parseFloat(platformFee.toFixed(2))).toBe(141.94);
      const userFee = component.calculateFeeValue(150, 1, 0, '2026-07-13', '2026-07-22');
      expect(parseFloat(userFee.toFixed(2))).toBe(48.39);
    });

    // Verifies that header details fall back to 0 when dates are unselected
    it('should initial term and contract value to 0 and update dynamically', () => {
      fixture.detectChanges();
      component.subscriptionStartDate = '';
      component.subscriptionEndDate = '';
      component.detailsForm.patchValue({ termStartDate: '', termEndDate: '' });
      fixture.detectChanges();
      expect(component.headerTermMonths).toBe('0');
      expect(component.headerTotalContractValue).toBe(0);
    });

    // Verifies that expanding/collapsing a period accordion card is non-destructive to other period expansion states
    it('should not collapse other periods when expanding/collapsing a period', () => {
      fixture.detectChanges();
      component.periods = [
        { name: 'Period 1', startDate: '2026-02-01', endDate: '2027-01-31', platformProduct: '', discount: 0, childProducts: [], expanded: true },
        { name: 'Period 2', startDate: '2027-02-01', endDate: '2028-01-31', platformProduct: '', discount: 0, childProducts: [], expanded: true }
      ];
      component.togglePeriodExpansion(component.periods[0]);
      expect(component.periods[0].expanded).toBeFalse();
      expect(component.periods[1].expanded).toBeTrue();
    });

    // Verifies that choosing Yearly period generation blocks creation if overall subscription duration is not in exact integer years
    it('should block period creation and show toast error if Yearly is chosen and duration is not exact years', () => {
      fixture.detectChanges();
      component.subscriptionStartDate = '2026-07-13';
      component.subscriptionEndDate = '2027-07-22';
      spyOn(component, 'showToast');
      component.periods = [];
      component.createPeriods('Yearly');
      expect(component.showToast).toHaveBeenCalledWith('For Yearly, you must select a duration of exact years.');
      expect(component.periods.length).toBe(0);
    });

    // Verifies that period duration labels calculation handles calendar month boundaries correctly (e.g. 0M 19D for 19 days)
    it('should calculate period duration labels using calendar difference (e.g. 0M 19D for 19 days)', () => {
      fixture.detectChanges();
      const label = component.getPeriodDuration('2026-07-13', '2026-07-31');
      expect(label).toBe('0M 19D (19 Days)');
    });
  });
});

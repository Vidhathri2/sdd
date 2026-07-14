import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CrmService } from '../../services/crm.service';
import { PeriodService, Period, ValidationResult } from '../../services/period.service';
import { CommitFlowComponent } from '../commit-flow/commit-flow.component';

@Component({
  selector: 'app-quote-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CommitFlowComponent],
  templateUrl: './quote-wizard.component.html',
  styleUrls: ['./quote-wizard.component.css']
})
export class QuoteWizardComponent implements OnInit {
  isCommitFlow: boolean = false;
  detailsForm: FormGroup;
  
  billingFrequencyOptions: string[] = [];
  termStartsOnOptions: string[] = [];
  operationTypeOptions: string[] = [];
  regionOptions: string[] = [];

  quoteDetails: any = null;
  paymentAccount: any = null;
  quoteName: string = '';
  sessionAccountName: string = '';
  sessionOpportunityName: string = '';
  todayStr: string = '';
  currentQuoteId: string = '';
  dynamicTermMonths: number = 0;
  dynamicTotalContractValue: number = 0;
  bundleLineItems: any[] = [];
  bundleHierarchy: any = null;

  subscriptionStartDate: string = '';
  subscriptionEndDate: string = '';
  
  periods: Period[] = [];
  showCreatePeriodsModal: boolean = false;
  showPreviewModal: boolean = false;
  showSuccessModal: boolean = false;
  isSubmitting: boolean = false;
  generationMode: string = 'Yearly';
  customMonthsPerPeriod: number = 12;

  activeTab: 'details' | 'plans' = 'details';

  toastMessage: string | null = null;
  toastType: 'error' | 'success' | 'info' = 'error';

  showToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }

  onTabChange(tab: 'details' | 'plans') {
    if (tab === 'plans' && !this.isCommitFlow) {
      const termStartDateCtrl = this.detailsForm.get('termStartDate');
      const termEndDateCtrl = this.detailsForm.get('termEndDate');
      
      const isStartDateRequiredAndMissing = termStartDateCtrl?.enabled && !termStartDateCtrl?.value;
      const isEndDateMissing = !termEndDateCtrl?.value;

      if (isStartDateRequiredAndMissing || isEndDateMissing) {
        this.showToast('Please select the Term Start Date and Term End Date before proceeding to Plans & Discounts.');
        return;
      }
    }
    this.activeTab = tab;
  }

  openDropdown: string | null = null;

  @HostListener('document:click')
  closeDropdowns() {
    this.openDropdown = null;
  }

  toggleDropdown(field: string, event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === field ? null : field;
  }

  selectOption(field: string, value: string, event: Event) {
    event.stopPropagation();
    this.detailsForm.get(field)?.setValue(value);
    this.openDropdown = null;
  }

  selectChildRegion(child: any, opt: string, event: Event) {
    event.stopPropagation();
    child.region = opt;
    this.openDropdown = null;
  }

  constructor(
    private fb: FormBuilder,
    private crmService: CrmService,
    private periodService: PeriodService,
    private router: Router
  ) {
    const today = new Date();
    this.todayStr = today.toISOString().split('T')[0];
    
    // Expiration date (45 days from now)
    const expDate = new Date(today);
    expDate.setDate(expDate.getDate() + 45);
    const expStr = expDate.toISOString().split('T')[0];

    // Term Start Date (1st of next month)
    const startDate = new Date(today);
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() + 1);
    const startStr = startDate.toISOString().split('T')[0];

    // Term End Date (3 years later - 1 day)
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 3);
    endDate.setDate(endDate.getDate() - 1);
    const endStr = endDate.toISOString().split('T')[0];

    this.detailsForm = this.fb.group({
      primaryContact: ['Sarah Connor', Validators.required],
      salesChannel: ['Direct', Validators.required],
      operationType: ['New', Validators.required],
      quoteExpirationDate: [expStr, Validators.required],
      billingFrequency: ['Annual in Advance Anniversary', Validators.required],
      termStartsOn: ['Fixed Start Date', Validators.required],
      termStartDate: [startStr, Validators.required],
      termEndDate: [endStr, Validators.required]
    });

    this.subscriptionStartDate = startStr;
    this.subscriptionEndDate = endStr;
  }

  ngOnInit(): void {
    this.loadPicklists();

    this.quoteName = sessionStorage.getItem('quoteName') || '';
    this.sessionAccountName = sessionStorage.getItem('selectedAccountName') || '';
    this.sessionOpportunityName = sessionStorage.getItem('selectedOpportunityName') || '';

    const quoteId = sessionStorage.getItem('selectedQuoteId');
    if (quoteId) {
      this.currentQuoteId = quoteId;
      this.crmService.getQuoteDetails(quoteId).subscribe(details => {
        this.quoteDetails = details;
        this.paymentAccount = details.paymentAccount;
        
        // Load bundle quote line items
        this.crmService.getBundleQuoteLineItems(quoteId).subscribe(bundleRes => {
          this.bundleLineItems = bundleRes.records || [];
          
          // Determine if Commit Flow should be active based on the actual selected product
          const configuredProduct = this.bundleLineItems[0]?.Product2?.Name || sessionStorage.getItem('mockConfiguredProduct') || '';
          if (configuredProduct === 'Google Cloud Platform RCA' || configuredProduct === 'Google Cloud Platform') {
            this.isCommitFlow = true;
          }

          // Fetch PCM/CPQ bundle details hierarchy
          const productId = this.bundleLineItems[0]?.Product2Id || sessionStorage.getItem('mockConfiguredProductId') || '';
          if (productId) {
            this.crmService.getProductDetails(productId).subscribe(hierarchy => {
              this.bundleHierarchy = hierarchy;
              this.refreshPeriodsChildProducts();
            });

            // Fetch bundle product classifications on page load
            this.crmService.getProductClassifications(productId).subscribe({
              next: (classifications) => {
                console.log('[QuoteWizard OnInit] Successfully fetched ProductClassifications for commit flow:', classifications);
              },
              error: (err) => {
                console.warn('[QuoteWizard OnInit] Failed to fetch ProductClassifications on load:', err);
              }
            });
          }
        });

        // Default expiration date to 45 days from now
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 45);
        const expStr = expDate.toISOString().split('T')[0];

        this.detailsForm.patchValue({
          primaryContact: details.primaryContact || sessionStorage.getItem('selectedPrimaryContact') || '',
          salesChannel: details.salesChannel || 'Direct',
          operationType: 'New',
          quoteExpirationDate: expStr,
          billingFrequency: details.billingFrequency || 'Annual in Advance Anniversary',
          termStartsOn: details.termStartsOn || 'Fixed Start Date',
          termStartDate: details.termStartDate || '',
          termEndDate: details.termEndDate || ''
        });

        this.subscriptionStartDate = details.termStartDate;
        this.subscriptionEndDate = details.termEndDate;
      });
    }

    // Sync tab 1 to tab 2 dates
    this.detailsForm.get('termStartDate')?.valueChanges.subscribe(val => {
      if (val) {
        this.subscriptionStartDate = val;
      }
    });
    this.detailsForm.get('termEndDate')?.valueChanges.subscribe(val => {
      if (val) {
        this.subscriptionEndDate = val;
      }
    });

    // Term Starts on changes
    this.detailsForm.get('termStartsOn')?.valueChanges.subscribe(val => {
      const termStartDateCtrl = this.detailsForm.get('termStartDate');
      if (val === 'Upon Provisioning' || val === 'Customer Signature Date') {
        termStartDateCtrl?.disable();
        termStartDateCtrl?.setValue('', { emitEvent: false });
        this.subscriptionStartDate = '';
      } else {
        termStartDateCtrl?.enable();
      }
    });
  }

  loadPicklists(): void {
    this.crmService.getPicklists().subscribe(lists => {
      this.billingFrequencyOptions = lists.billingFrequencies || [];
      this.termStartsOnOptions = lists.termStartsOnOptions || [];
      this.operationTypeOptions = lists.operationTypes || [];
      this.regionOptions = lists.regions || [];
    });
  }

  onTermStartDateChange(newDate: string): void {
    if (this.periods.length > 0) {
      const proceed = window.confirm('Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?');
      if (proceed) {
        this.periods = [];
        this.detailsForm.get('termStartDate')?.setValue(newDate, { emitEvent: false });
        this.subscriptionStartDate = newDate;
      } else {
        // Rollback change
        const oldVal = this.detailsForm.get('termStartDate')?.value;
        this.detailsForm.get('termStartDate')?.setValue(oldVal, { emitEvent: false });
        // Make sure UI reflects this if it was bound to an input directly, but form handles it.
      }
    } else {
      this.detailsForm.get('termStartDate')?.setValue(newDate, { emitEvent: false });
      this.subscriptionStartDate = newDate;
    }
  }

  updateSubscriptionDates(start: string, end: string): void {
    this.subscriptionStartDate = start;
    this.subscriptionEndDate = end;
    this.detailsForm.patchValue({ termStartDate: start, termEndDate: end }, { emitEvent: false });
  }

  openCreatePeriodsModal(): void {
    this.showCreatePeriodsModal = true;
  }
  
  closeCreatePeriodsModal(): void {
    this.showCreatePeriodsModal = false;
  }

  createPeriods(mode: string): void {
    this.generationMode = mode;
    
    // Fallback to today's date if start date is empty/invalid
    const start = this.subscriptionStartDate || this.todayStr;
    let end = this.subscriptionEndDate;
    
    if (!end) {
      // Default term to 3 years from start date if end date is empty
      const d = new Date(start);
      d.setFullYear(d.getFullYear() + 3);
      d.setDate(d.getDate() - 1);
      end = d.toISOString().split('T')[0];
    }

    // Sync state and form controls
    this.updateSubscriptionDates(start, end);

    if (mode === 'Yearly') {
      this.periods = this.periodService.generateYearlyPeriods(start, end);
    } else {
      this.periods = this.periodService.generateCustomPeriods(
        start,
        end,
        this.customMonthsPerPeriod
      );
    }

    const dynamicChildren = this.getDynamicChildProducts();
    this.periods.forEach(p => {
      p.childProducts = JSON.parse(JSON.stringify(dynamicChildren));
    });

    this.closeCreatePeriodsModal();
  }

  addPeriod(): void {
    if (this.periods.length === 0) return;

    const lastPeriod = this.periods[this.periods.length - 1];
    const newStartDate = new Date(lastPeriod.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    const newEndDate = new Date(newStartDate);
    
    if (this.generationMode === 'Yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      newEndDate.setDate(newEndDate.getDate() - 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + this.customMonthsPerPeriod);
      newEndDate.setDate(newEndDate.getDate() - 1);
    }

    const startStr = newStartDate.toISOString().split('T')[0];
    const endStr = newEndDate.toISOString().split('T')[0];

    // Add the new period without collapsing others

    const dynamicChildren = this.getDynamicChildProducts();

    this.periods.push({
      name: `Period ${this.periods.length + 1}`,
      startDate: startStr,
      endDate: endStr,
      platformProduct: '',
      discount: 0,
      childProducts: JSON.parse(JSON.stringify(dynamicChildren)),
      expanded: true
    });

    // Update overall end date
    this.updateSubscriptionDates(this.subscriptionStartDate, endStr);

    // Auto-scroll to bottom to show new period and add button
    setTimeout(() => {
      const activeTabPane = document.querySelector('.tab-pane:not([hidden])');
      if (activeTabPane) {
        activeTabPane.scrollTo({
          top: activeTabPane.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  validateAllPeriods(): ValidationResult {
    return this.periodService.validatePeriods(this.periods);
  }

  refreshPeriodsChildProducts(): void {
    if (!this.bundleHierarchy || !this.bundleHierarchy.result) return;
    const dynamicChildren = this.getDynamicChildProducts();
    this.periods.forEach(period => {
      if (!period.childProducts || period.childProducts.length === 0) {
        period.childProducts = JSON.parse(JSON.stringify(dynamicChildren));
      } else {
        period.childProducts.forEach(child => {
          const matchingDyn = dynamicChildren.find(dc => dc.name === child.name);
          if (matchingDyn) {
            child.productId = matchingDyn.productId;
            child.productCode = matchingDyn.productCode;
            child.crmProductName = matchingDyn.crmProductName;
          }
        });
      }
      this.onPeriodPlatformChange(period);
    });
  }

  submitQuote(): void {
    // Step 1: Validate the Details form
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      this.showToast('Please fill in all required fields in the Details tab before submitting.', 'error');
      this.activeTab = 'details';
      return;
    }

    // Step 2: Require at least one subscription period
    if (this.periods.length === 0) {
      this.showToast('Please create at least one subscription period in the Plans & Discounts tab before submitting.', 'error');
      this.activeTab = 'plans';
      return;
    }

    // Step 3: Validate all period configurations
    const validation = this.validateAllPeriods();
    if (!validation.isValid) {
      const msg = validation.errors?.[0]?.message || 'One or more subscription periods are incomplete. Please select a Platform for each period.';
      this.showToast(msg, 'error');
      this.activeTab = 'plans';
      return;
    }

    // Step 4: Build composite graph payload
    const payload = this.buildSubmitPayload();
    console.log('[Submit] Composite Graph Payload:', JSON.stringify(payload, null, 2));

    // Step 5: Fire the single API call
    this.isSubmitting = true;
    this.crmService.submitQuoteDetails(payload).subscribe(
      res => {
        this.isSubmitting = false;
        if (res && (res.isSuccess || res.success)) {
          this.showSuccessModal = true;
        } else {
          const errorMsg = res?.errorResponse?.[0]?.message
            || res?.errors?.[0]?.message
            || res?.message
            || 'Quote submission failed. Please review your configuration and try again.';
          this.showToast(errorMsg, 'error');
        }
      },
      error => {
        this.isSubmitting = false;
        const errorMsg = error?.error?.[0]?.message
          || error?.error?.message
          || error?.message
          || 'An unexpected error occurred during submission. Please try again.';
        console.error('[Submit] Error:', error);
        this.showToast(errorMsg, 'error');
      }
    );
  }

  onSuccessModalOk(): void {
    this.showSuccessModal = false;
    sessionStorage.clear();
    this.router.navigate(['/opportunities']);
  }

  getComponentDetails(nameOrKey: string): { productId: string, pricebookEntryId: string, productRelationshipTypeId: string } | null {
    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return {
        productId: 'mock-product-id',
        pricebookEntryId: 'mock-pricebook-entry-id',
        productRelationshipTypeId: '0yoKf0000010wFiIAI'
      };
    }
    let foundComponent: any = null;
    let relationshipTypeId = '';
    
    this.bundleHierarchy.result.productComponentGroups.forEach((group: any) => {
      const comp = (group.components || []).find((c: any) => c.name === nameOrKey || c.name.includes(nameOrKey));
      if (comp) {
        foundComponent = comp;
        relationshipTypeId = comp.productRelatedComponent?.productRelationshipTypeId || '';
      }
    });

    if (foundComponent) {
      const prices = foundComponent.prices || [];
      let priceObj = prices.find((p: any) => p.pricingModel?.frequency === 'Months');
      if (!priceObj) {
        priceObj = prices.find((p: any) => p.isDefault) || prices[0];
      }
      return {
        productId: foundComponent.id,
        pricebookEntryId: priceObj?.pricebookEntryId || priceObj?.priceBookEntryId || priceObj?.PricebookEntryId || foundComponent.pricebookEntryId || foundComponent.priceBookEntryId || 'mock-pbe-id',
        productRelationshipTypeId: relationshipTypeId
      };
    }
    return {
      productId: 'mock-product-id',
      pricebookEntryId: 'mock-pricebook-entry-id',
      productRelationshipTypeId: '0yoKf0000010wFiIAI'
    };
  }

  calculateTermMonths(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays >= 364 && diffDays <= 366) {
      return 12;
    }
    return diffDays / 30.4375;
  }

  getBillingFrequencyCPQ(val: string): string {
    if (!val) return 'Annual';
    const low = val.toLowerCase();
    if (low.includes('monthly') || low.includes('month')) return 'Monthly';
    if (low.includes('quarterly')) return 'Quarterly';
    return 'Annual';
  }

  buildSubmitPayload(): any {
    const quoteId = this.currentQuoteId || sessionStorage.getItem('selectedQuoteId') || 'unknown';
    const mainBundle = this.bundleLineItems[0] || {};
    const mainBundleLineItemId = mainBundle.Id || 'mock-bundle-line-id';
    const mainBundleProductId = mainBundle.Product2Id || sessionStorage.getItem('mockConfiguredProductId') || 'mock-bundle-product-id';
    const mainBundlePricebookEntryId = mainBundle.PricebookEntryId || 'mock-bundle-pbe-id';

    const billingFrequency = this.detailsForm.get('billingFrequency')?.value || 'Annual in Advance Anniversary';
    const billingFrequencyCPQ = this.getBillingFrequencyCPQ(billingFrequency);
    const operationType = this.detailsForm.get('operationType')?.value || 'New';
    const termStartsOn = this.detailsForm.get('termStartsOn')?.value || 'Fixed Start Date';
    const termStartDate = this.detailsForm.get('termStartDate')?.value || this.subscriptionStartDate || '';
    const quoteExpirationDate = this.detailsForm.get('quoteExpirationDate')?.value || '';

    const records: any[] = [];

    // Record 0: Quote PATCH
    records.push({
      referenceId: 'refQuote',
      record: {
        attributes: {
          type: 'Quote',
          method: 'PATCH',
          id: quoteId
        },
        StartDate: termStartDate,
        ExpirationDate: quoteExpirationDate
      }
    });

    if (this.periods.length === 1) {
      const period = this.periods[0];
      const periodTermInMonths = this.calculateTermMonths(period.startDate, period.endDate);

      // Record 1: QuoteLineItem PATCH for main bundle
      records.push({
        referenceId: 'refLineUpdate_0',
        record: {
          attributes: {
            type: 'QuoteLineItem',
            method: 'PATCH',
            id: mainBundleLineItemId
          },
          SortOrder: 1,
          Billing_Frequency__c: billingFrequency,
          EndDate: period.endDate,
          Operation_Type__c: operationType,
          PeriodBoundary: 'Anniversary',
          StartDate: period.startDate,
          SubscriptionTerm: periodTermInMonths,
          SubscriptionTermUnit: 'Months',
          Term_Starts_On__c: termStartsOn
        }
      });

      let sortOrder = 2;

      // Platform child product
      if (period.platformProduct) {
        const platDetails = this.getComponentDetails(period.platformProduct);
        const childRefId = 'refChildQuoteLineItem_P1';
        records.push({
          referenceId: childRefId,
          record: {
            attributes: {
              type: 'QuoteLineItem',
              method: 'POST'
            },
            SortOrder: sortOrder++,
            QuoteId: quoteId,
            BillingFrequency: billingFrequencyCPQ,
            Billing_Frequency__c: billingFrequency,
            EndDate: period.endDate,
            Operation_Type__c: operationType,
            PeriodBoundary: 'Anniversary',
            PricebookEntryId: platDetails?.pricebookEntryId || '',
            Product2Id: platDetails?.productId || '',
            Quantity: 1,
            StartDate: period.startDate,
            SubscriptionTerm: periodTermInMonths,
            SubscriptionTermUnit: 'Months',
            Term_Starts_On__c: termStartsOn
          }
        });

        // Relationship
        records.push({
          referenceId: 'refRel_P1_1',
          record: {
            attributes: {
              type: 'QuoteLineRelationship',
              method: 'POST'
            },
            MainQuoteLineId: mainBundleLineItemId,
            AssociatedQuoteLineId: `@{${childRefId}.id}`,
            AssociatedQuoteLinePricing: 'NotIncludedInBundlePrice',
            ProductRelationshipTypeId: platDetails?.productRelationshipTypeId || '0yoKf0000010wFiIAI'
          }
        });
      }

      // Remaining child products with quantity > 0
      let childIndex = 2;
      (period.childProducts || []).forEach(child => {
        if (child.quantity > 0) {
          const childDetails = this.getComponentDetails(child.crmProductName || child.name);
          const childRefId = `refChildQuoteLineItem_P1-${childIndex}`;
          records.push({
            referenceId: childRefId,
            record: {
              attributes: {
                type: 'QuoteLineItem',
                method: 'POST'
              },
              SortOrder: sortOrder++,
              QuoteId: quoteId,
              BillingFrequency: billingFrequencyCPQ,
              Billing_Frequency__c: billingFrequency,
              EndDate: period.endDate,
              Operation_Type__c: operationType,
              PeriodBoundary: 'Anniversary',
              PricebookEntryId: childDetails?.pricebookEntryId || '',
              Product2Id: childDetails?.productId || '',
              Quantity: child.quantity,
              StartDate: period.startDate,
              SubscriptionTerm: periodTermInMonths,
              SubscriptionTermUnit: 'Months',
              Term_Starts_On__c: termStartsOn,
              Discount: child.discount > 0 ? child.discount : undefined,
              GCP_Project_Id__c: child.gcpProjectId || undefined,
              Looker_Instance_Id__c: child.lookerInstanceId || undefined,
              Looker_Region__c: child.region || undefined
            }
          });

          // Relationship
          records.push({
            referenceId: `refRel_P1_${childIndex}`,
            record: {
              attributes: {
                type: 'QuoteLineRelationship',
                method: 'POST'
              },
              MainQuoteLineId: mainBundleLineItemId,
              AssociatedQuoteLineId: `@{${childRefId}.id}`,
              AssociatedQuoteLinePricing: 'NotIncludedInBundlePrice',
              ProductRelationshipTypeId: childDetails?.productRelationshipTypeId || '0yoKf0000010wFiIAI'
            }
          });

          childIndex++;
        }
      });

    } else {
      // Case 2: periods.length > 1
      for (let i = 1; i <= this.periods.length; i++) {
        const period = this.periods[i - 1];
        const periodTermInMonths = this.calculateTermMonths(period.startDate, period.endDate);
        const groupRefId = i === 1 ? 'refGroup1' : `refRampGroup_P${i}`;

        // Create QuoteLineGroup record
        records.push({
          referenceId: groupRefId,
          record: {
            attributes: {
              type: 'QuoteLineGroup',
              method: 'POST'
            },
            SortOrder: i,
            Name: period.name,
            EndDate: period.endDate,
            IsRamped: true,
            QuoteId: quoteId,
            SegmentType: this.generationMode || 'Yearly',
            StartDate: period.startDate
          }
        });

        // Handle bundle parent line item for this group
        let currentParentRefId = '';
        if (i === 1) {
          currentParentRefId = 'refLineUpdate_0';
          records.push({
            referenceId: currentParentRefId,
            record: {
              attributes: {
                type: 'QuoteLineItem',
                method: 'PATCH',
                id: mainBundleLineItemId
              },
              SortOrder: 1,
              Billing_Frequency__c: billingFrequency,
              EndDate: period.endDate,
              Operation_Type__c: operationType,
              PeriodBoundary: 'Anniversary',
              StartDate: period.startDate,
              SubscriptionTerm: periodTermInMonths,
              SubscriptionTermUnit: 'Months',
              Term_Starts_On__c: termStartsOn,
              QuoteLineGroupId: `@{${groupRefId}.id}`
            }
          });
        } else {
          currentParentRefId = `refBundleParent_P${i}`;
          records.push({
            referenceId: currentParentRefId,
            record: {
              attributes: {
                type: 'QuoteLineItem',
                method: 'POST'
              },
              SortOrder: 1,
              QuoteId: quoteId,
              QuoteLineGroupId: `@{${groupRefId}.id}`,
              Product2Id: mainBundleProductId,
              PricebookEntryId: mainBundlePricebookEntryId,
              Quantity: 1,
              StartDate: period.startDate,
              EndDate: period.endDate,
              SubscriptionTerm: periodTermInMonths,
              SubscriptionTermUnit: 'Months',
              Billing_Frequency__c: billingFrequency,
              Operation_Type__c: operationType,
              PeriodBoundary: 'Anniversary',
              Term_Starts_On__c: termStartsOn
            }
          });
        }

        let sortOrder = 2;

        // Platform child product for this period
        if (period.platformProduct) {
          const platDetails = this.getComponentDetails(period.platformProduct);
          const childRefId = `refChildQuoteLineItem_P${i}`;
          records.push({
            referenceId: childRefId,
            record: {
              attributes: {
                type: 'QuoteLineItem',
                method: 'POST'
              },
              SortOrder: sortOrder++,
              QuoteId: quoteId,
              QuoteLineGroupId: `@{${groupRefId}.id}`,
              BillingFrequency: billingFrequencyCPQ,
              Billing_Frequency__c: billingFrequency,
              EndDate: period.endDate,
              Operation_Type__c: operationType,
              PeriodBoundary: 'Anniversary',
              PricebookEntryId: platDetails?.pricebookEntryId || '',
              Product2Id: platDetails?.productId || '',
              Quantity: 1,
              StartDate: period.startDate,
              SubscriptionTerm: periodTermInMonths,
              SubscriptionTermUnit: 'Months',
              Term_Starts_On__c: termStartsOn
            }
          });

          // Relationship
          records.push({
            referenceId: `refRel_P${i}_1`,
            record: {
              attributes: {
                type: 'QuoteLineRelationship',
                method: 'POST'
              },
              MainQuoteLineId: i === 1 ? mainBundleLineItemId : `@{${currentParentRefId}.id}`,
              AssociatedQuoteLineId: `@{${childRefId}.id}`,
              AssociatedQuoteLinePricing: 'NotIncludedInBundlePrice',
              ProductRelationshipTypeId: platDetails?.productRelationshipTypeId || '0yoKf0000010wFiIAI'
            }
          });
        }

        // Remaining child products with quantity > 0
        let childIndex = 2;
        (period.childProducts || []).forEach(child => {
          if (child.quantity > 0) {
            const childDetails = this.getComponentDetails(child.crmProductName || child.name);
            const childRefId = `refChildQuoteLineItem_P${i}-${childIndex}`;
            records.push({
              referenceId: childRefId,
              record: {
                attributes: {
                  type: 'QuoteLineItem',
                  method: 'POST'
                },
                SortOrder: sortOrder++,
                QuoteId: quoteId,
                QuoteLineGroupId: `@{${groupRefId}.id}`,
                BillingFrequency: billingFrequencyCPQ,
                Billing_Frequency__c: billingFrequency,
                EndDate: period.endDate,
                Operation_Type__c: operationType,
                PeriodBoundary: 'Anniversary',
                PricebookEntryId: childDetails?.pricebookEntryId || '',
                Product2Id: childDetails?.productId || '',
                Quantity: child.quantity,
                StartDate: period.startDate,
                SubscriptionTerm: periodTermInMonths,
                SubscriptionTermUnit: 'Months',
                Term_Starts_On__c: termStartsOn,
                Discount: child.discount > 0 ? child.discount : undefined,
                GCP_Project_Id__c: child.gcpProjectId || undefined,
                Looker_Instance_Id__c: child.lookerInstanceId || undefined,
                Looker_Region__c: child.region || undefined
              }
            });

            // Relationship
            records.push({
              referenceId: `refRel_P${i}_${childIndex}`,
              record: {
                attributes: {
                  type: 'QuoteLineRelationship',
                  method: 'POST'
                },
                MainQuoteLineId: i === 1 ? mainBundleLineItemId : `@{${currentParentRefId}.id}`,
                AssociatedQuoteLineId: `@{${childRefId}.id}`,
                AssociatedQuoteLinePricing: 'NotIncludedInBundlePrice',
                ProductRelationshipTypeId: childDetails?.productRelationshipTypeId || '0yoKf0000010wFiIAI'
              }
            });

            childIndex++;
          }
        });
      }
    }

    return {
      pricingPref: 'System',
      catalogRatesPref: 'Skip',
      configurationPref: {
        configurationMethod: 'Skip',
        configurationOptions: {
          validateProductCatalog: true,
          validateAmendRenewCancel: true,
          executeConfigurationRules: true,
          addDefaultConfiguration: false
        }
      },
      contextDetails: {},
      graph: {
        graphId: 'updateQuote',
        records: records
      },
      taxPref: 'Skip'
    };
  }

  onCommitTotalsChanged(totals: { months: number, amount: number }): void {
    this.dynamicTermMonths = totals.months;
    this.dynamicTotalContractValue = totals.amount;
  }

  onSubscriptionStartDateChange(newDate: string): void {
    this.onTermStartDateChange(newDate);
  }

  onSubscriptionEndDateChange(newDate: string): void {
    if (this.periods.length > 0) {
      const proceed = window.confirm('Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?');
      if (proceed) {
        this.periods = [];
        this.detailsForm.get('termEndDate')?.setValue(newDate, { emitEvent: false });
        this.subscriptionEndDate = newDate;
      } else {
        const oldVal = this.detailsForm.get('termEndDate')?.value;
        this.detailsForm.get('termEndDate')?.setValue(oldVal, { emitEvent: false });
      }
    } else {
      this.detailsForm.get('termEndDate')?.setValue(newDate, { emitEvent: false });
      this.subscriptionEndDate = newDate;
    }
  }

  onBack(): void {
    this.router.navigate(['/product-selection']);
  }

  get isSubmitDisabled(): boolean {
    return this.isSubmitting || this.detailsForm.invalid;
  }

  getBillingFrequencyKey(): 'Annual' | 'Months' {
    return 'Months';
  }

  getChildBasePrice(child: any, period: any): string {
    // Before selecting platform, don't show prices under remaining fields
    if (!period.platformProduct) {
      return '';
    }

    const crmName = child.crmProductName;
    if (!crmName) {
      return '$0.00 / Year';
    }

    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return '$0.00 / Year';
    }

    let component: any = null;
    this.bundleHierarchy.result.productComponentGroups.forEach((group: any) => {
      const found = (group.components || []).find((c: any) => c.name === crmName);
      if (found) {
        component = found;
      }
    });

    if (!component || !component.prices || component.prices.length === 0) {
      return '$0.00 / Year';
    }

    const freqKey = this.getBillingFrequencyKey();
    let priceObj = component.prices.find((p: any) => p.pricingModel?.frequency === freqKey);
    if (!priceObj) {
      priceObj = component.prices.find((p: any) => p.isDefault) || component.prices[0];
    }

    if (priceObj) {
      const frequencyText = freqKey === 'Months' ? 'Month' : 'Year';
      return `$${priceObj.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${frequencyText}`;
    }

    return '$0.00 / Year';
  }

  getPeriodDuration(startDateStr: string, endDateStr: string): string {
    if (!startDateStr || !endDateStr) return '';
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const months = Math.round(diffDays / 30.4375);
    if (months === 12) {
      return `12M 0D (${diffDays} Days)`;
    }
    return `${months}M 0D (${diffDays} Days)`;
  }

  togglePeriodExpansion(period: Period): void {
    period.expanded = !period.expanded;
  }

  getDynamicChildProducts(platformProduct: string = ''): any[] {
    const defaultList = [
      { name: 'Standard User', searchKey: 'Standard User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0, productId: '', productCode: '', crmProductName: '' },
      { name: 'Developer User', searchKey: 'Developer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0, productId: '', productCode: '', crmProductName: '' },
      { name: 'Viewer User', searchKey: 'Viewer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0, productId: '', productCode: '', crmProductName: '' },
      { name: 'Non-prod', searchKey: 'Nonprod', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0, productId: '', productCode: '', crmProductName: '' }
    ];

    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return defaultList;
    }

    const groups = this.bundleHierarchy.result.productComponentGroups;

    // Resolve Users from all component groups to be robust
    defaultList.forEach(item => {
      if (item.name !== 'Non-prod') {
        let foundComp: any = null;
        groups.forEach((group: any) => {
          const comp = (group.components || []).find((c: any) => c.name.includes(item.searchKey));
          if (comp) {
            foundComp = comp;
          }
        });
        if (foundComp) {
          item.productId = foundComp.id;
          item.productCode = foundComp.productCode;
          item.crmProductName = foundComp.name;
        }
      }
    });

    // Resolve Non-prod from all component groups to be robust
    const nonprodComponents: any[] = [];
    groups.forEach((group: any) => {
      (group.components || []).forEach((c: any) => {
        if (c.name.includes('Nonprod') || c.name.includes('Non-prod')) {
          nonprodComponents.push(c);
        }
      });
    });

    if (nonprodComponents.length > 0) {
      const nonprodItem = defaultList.find(item => item.name === 'Non-prod');
      if (nonprodItem) {
        let targetComponent: any = null;
        if (platformProduct.includes('Standard Platform') || platformProduct.includes('Standard Annual Subscription')) {
          targetComponent = nonprodComponents.find((c: any) => c.name.includes('Standard'));
        } else {
          targetComponent = nonprodComponents.find((c: any) => c.name.includes('Enterprise') || c.name.includes('Premium'));
        }

        if (!targetComponent) {
          targetComponent = nonprodComponents[0];
        }

        if (targetComponent) {
          nonprodItem.productId = targetComponent.id;
          nonprodItem.productCode = targetComponent.productCode;
          nonprodItem.crmProductName = targetComponent.name;
        }
      }
    }

    return defaultList;
  }

  onPeriodPlatformChange(period: Period): void {
    const nonProdItem = period.childProducts.find(cp => cp.name === 'Non-prod') as any;
    if (!nonProdItem) return;

    const platform = period.platformProduct || '';
    const nonprodComponents: any[] = [];
    if (this.bundleHierarchy && this.bundleHierarchy.result && this.bundleHierarchy.result.productComponentGroups) {
      this.bundleHierarchy.result.productComponentGroups.forEach((group: any) => {
        (group.components || []).forEach((c: any) => {
          if (c.name.includes('Nonprod') || c.name.includes('Non-prod')) {
            nonprodComponents.push(c);
          }
        });
      });
    }

    if (nonprodComponents.length > 0) {
      let targetComponent: any = null;
      if (platform.includes('Standard Platform') || platform.includes('Standard Annual Subscription')) {
        targetComponent = nonprodComponents.find((c: any) => c.name.includes('Standard'));
      } else {
        targetComponent = nonprodComponents.find((c: any) => c.name.includes('Enterprise') || c.name.includes('Premium'));
      }

      if (!targetComponent) {
        targetComponent = nonprodComponents[0];
      }

      if (targetComponent) {
        nonProdItem.productId = targetComponent.id;
        nonProdItem.productCode = targetComponent.productCode;
        nonProdItem.crmProductName = targetComponent.name;
      }
    }
  }

  getPlatformOptions(): any[] {
    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return [
        { name: 'Looker (Google Cloud core) Standard Platform Annual Subscription RCA', displayName: 'Looker (Google Cloud core) Standard Platform Annual Subscription RCA' },
        { name: 'Looker (Google Cloud core) Enterprise Platform Annual Subscription RCA', displayName: 'Looker (Google Cloud core) Enterprise Platform Annual Subscription RCA' }
      ];
    }
    const platformGroup = this.bundleHierarchy.result.productComponentGroups.find((g: any) => g.name === 'Platform');
    if (!platformGroup) return [];

    return (platformGroup.components || []).map((comp: any) => {
      return {
        name: comp.name,
        displayName: comp.name
      };
    });
  }

  getPlatformPrice(name: string): string {
    if (!name) return '';

    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return '';
    }

    const platformGroup = this.bundleHierarchy.result.productComponentGroups.find((g: any) => g.name === 'Platform');
    if (!platformGroup) return '';

    const component = (platformGroup.components || []).find((c: any) => c.name === name);
    if (!component || !component.prices || component.prices.length === 0) {
      return '';
    }

    const freqKey = this.getBillingFrequencyKey();
    let priceObj = component.prices.find((p: any) => p.pricingModel?.frequency === freqKey);
    if (!priceObj) {
      priceObj = component.prices.find((p: any) => p.isDefault) || component.prices[0];
    }

    if (priceObj) {
      const frequencyText = freqKey === 'Months' ? 'Month' : 'Year';
      return `$${priceObj.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${frequencyText}`;
    }

    return '';
  }

  getPlatformRawPrice(name: string): number {
    if (!name || !this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return 0;
    }
    const platformGroup = this.bundleHierarchy.result.productComponentGroups.find((g: any) => g.name === 'Platform');
    if (!platformGroup) return 0;

    const component = (platformGroup.components || []).find((c: any) => c.name === name);
    if (!component || !component.prices || component.prices.length === 0) {
      return 0;
    }

    const freqKey = this.getBillingFrequencyKey();
    let priceObj = component.prices.find((p: any) => p.pricingModel?.frequency === freqKey);
    if (!priceObj) {
      priceObj = component.prices.find((p: any) => p.isDefault) || component.prices[0];
    }
    return priceObj ? priceObj.price : 0;
  }

  getChildRawPrice(child: any, period: any): number {
    if (!period.platformProduct || !child.crmProductName) {
      return 0;
    }
    if (!this.bundleHierarchy || !this.bundleHierarchy.result || !this.bundleHierarchy.result.productComponentGroups) {
      return 0;
    }

    let component: any = null;
    this.bundleHierarchy.result.productComponentGroups.forEach((group: any) => {
      const found = (group.components || []).find((c: any) => c.name === child.crmProductName);
      if (found) {
        component = found;
      }
    });

    if (!component || !component.prices || component.prices.length === 0) {
      return 0;
    }

    const freqKey = this.getBillingFrequencyKey();
    let priceObj = component.prices.find((p: any) => p.pricingModel?.frequency === freqKey);
    if (!priceObj) {
      priceObj = component.prices.find((p: any) => p.isDefault) || component.prices[0];
    }
    return priceObj ? priceObj.price : 0;
  }

  getDurationString(startDateStr: string, endDateStr: string): string {
    if (!startDateStr || !endDateStr) {
      return '0';
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return '0';
    }

    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const startDate = start.getDate();

    const endEx = new Date(end);
    endEx.setDate(endEx.getDate() + 1);

    const endYear = endEx.getFullYear();
    const endMonth = endEx.getMonth();
    const endDate = endEx.getDate();

    let months = (endYear - startYear) * 12 + (endMonth - startMonth);
    let days = endDate - startDate;

    if (days < 0) {
      months -= 1;
      const tempDate = new Date(startYear, startMonth + 1, 0);
      days += tempDate.getDate();
    }

    const parts: string[] = [];
    if (months > 0) {
      parts.push(`${months} month${months > 1 ? 's' : ''}`);
    }
    if (days > 0) {
      parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(' ') : '0 days';
  }

  get headerTermMonths(): string {
    if (this.isCommitFlow) {
      return `${this.dynamicTermMonths} months`;
    }
    const start = this.detailsForm.get('termStartDate')?.value || this.subscriptionStartDate;
    const end = this.detailsForm.get('termEndDate')?.value || this.subscriptionEndDate;
    return this.getDurationString(start, end);
  }

  get headerTotalContractValue(): number {
    if (this.isCommitFlow) {
      return this.dynamicTotalContractValue;
    }
    if (!this.periods || this.periods.length === 0) {
      return 0;
    }
    let total = 0;
    this.periods.forEach(period => {
      const termMonths = this.calculateTermMonths(period.startDate, period.endDate);

      if (period.platformProduct) {
        const basePrice = this.getPlatformRawPrice(period.platformProduct);
        total += basePrice * termMonths;
      }

      (period.childProducts || []).forEach(child => {
        if (child.quantity > 0) {
          const rawPrice = this.getChildRawPrice(child, period);
          const discountMultiplier = (100 - (child.discount || 0)) / 100;
          total += rawPrice * child.quantity * termMonths * discountMultiplier;
        }
      });
    });
    return total;
  }

  get previewBundleProductName(): string {
    return this.bundleLineItems[0]?.Product2?.Name || sessionStorage.getItem('mockConfiguredProduct') || 'Looker New RCA';
  }

  openPreviewModal(): void {
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  formatDateMMDDYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  formatDateMMDDYYYYDashes(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  getOrderTermLabel(startDateStr: string, endDateStr: string): string {
    if (!startDateStr || !endDateStr) return '';
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return '';

    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const startDate = start.getDate();
    const endEx = new Date(end);
    endEx.setDate(endEx.getDate() + 1);
    const endYear = endEx.getFullYear();
    const endMonth = endEx.getMonth();
    const endDate = endEx.getDate();

    let months = (endYear - startYear) * 12 + (endMonth - startMonth);
    let days = endDate - startDate;
    if (days < 0) {
      months -= 1;
      const tempDate = new Date(startYear, startMonth + 1, 0);
      days += tempDate.getDate();
    }

    if (days === 0 && months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  calculateFeeValue(monthlyPrice: number, quantity: number, discount: number, startDateStr: string, endDateStr: string): number {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const startDate = start.getDate();
    const endEx = new Date(end);
    endEx.setDate(endEx.getDate() + 1);
    const endYear = endEx.getFullYear();
    const endMonth = endEx.getMonth();
    const endDate = endEx.getDate();

    let months = (endYear - startYear) * 12 + (endMonth - startMonth);
    let days = endDate - startDate;
    if (days < 0) {
      months -= 1;
      const tempDate = new Date(startYear, startMonth + 1, 0);
      days += tempDate.getDate();
    }

    let durationMultiplier = 0;
    if (days === 0 && months > 0) {
      durationMultiplier = months;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      durationMultiplier = diffDays / 31;
    }

    const listPrice = monthlyPrice * quantity * durationMultiplier;
    const discountMultiplier = (100 - (discount || 0)) / 100;
    return listPrice * discountMultiplier;
  }

  getLineFee(nameOrChild: any, period: Period, isPlatform: boolean): number {
    let monthlyPrice = 0;
    let quantity = 1;
    let discount = 0;

    if (isPlatform) {
      monthlyPrice = this.getPlatformRawPrice(nameOrChild);
      quantity = 1;
      discount = 0;
    } else {
      monthlyPrice = this.getChildRawPrice(nameOrChild, period);
      quantity = nameOrChild.quantity;
      discount = nameOrChild.discount;
    }

    return this.calculateFeeValue(monthlyPrice, quantity, discount, period.startDate, period.endDate);
  }

  getLineListPrice(nameOrChild: any, period: Period, isPlatform: boolean): number {
    if (isPlatform) {
      return this.getPlatformRawPrice(nameOrChild);
    } else {
      return this.getChildRawPrice(nameOrChild, period);
    }
  }

  getPeriodTotal(period: Period): number {
    let total = 0;
    if (period.platformProduct) {
      total += this.getLineFee(period.platformProduct, period, true);
    }
    (period.childProducts || []).forEach(child => {
      if (child.quantity > 0) {
        total += this.getLineFee(child, period, false);
      }
    });
    return total;
  }

  getGrandTotal(): number {
    let total = 0;
    this.periods.forEach(p => {
      total += this.getPeriodTotal(p);
    });
    return total;
  }

  viewInSalesforce(): void {
    if (!this.currentQuoteId) return;
    const salesforceDomain = 'https://vector--agivant2.sandbox.lightning.force.com';
    const url = `${salesforceDomain}/lightning/r/Quote/${this.currentQuoteId}/view`;
    window.open(url, '_blank');
  }

}

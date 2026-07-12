import { Component, OnInit } from '@angular/core';
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

  quoteDetails: any = null;
  paymentAccount: any = null;

  subscriptionStartDate: string = '';
  subscriptionEndDate: string = '';
  
  periods: Period[] = [];
  showCreatePeriodsModal: boolean = false;
  generationMode: string = 'Yearly';
  customMonthsPerPeriod: number = 12;

  activeTab: 'details' | 'plans' = 'details';
  todayStr: string = '';

  // Dynamic Header Variables for Commit Flow
  dynamicTermMonths: number = 0;
  dynamicTotalContractValue: number = 0;

  sessionAccountName: string = '';
  sessionOpportunityName: string = '';
  sessionConfiguredProduct: string = '';

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

    this.sessionAccountName = sessionStorage.getItem('selectedAccountName') || '';
    this.sessionOpportunityName = sessionStorage.getItem('selectedOpportunityName') || '';
    this.sessionConfiguredProduct = sessionStorage.getItem('mockConfiguredProduct') || '';

    const quoteId = sessionStorage.getItem('selectedQuoteId');
    if (quoteId) {
      this.crmService.getQuoteDetails(quoteId).subscribe(details => {
        this.quoteDetails = details;
        this.paymentAccount = details.paymentAccount;
        
        // Determine if Commit Flow should be active based on the actual selected product
        const configuredProduct = sessionStorage.getItem('mockConfiguredProduct') || '';
        if (configuredProduct === 'Google Cloud Platform RCA' || configuredProduct === 'Google Cloud Platform') {
          this.isCommitFlow = true;
        }

        // Default expiration date to 45 days from now
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 45);
        const expStr = expDate.toISOString().split('T')[0];

        this.detailsForm.patchValue({
          primaryContact: details.primaryContact || '',
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

    // Collapse other periods to ensure only one is expanded
    this.periods.forEach(p => p.expanded = false);

    this.periods.push({
      name: `Period ${this.periods.length + 1}`,
      startDate: startStr,
      endDate: endStr,
      platformProduct: '',
      discount: 0,
      childProducts: this.periodService.getDefaultChildProducts(),
      expanded: true
    });

    // Update overall end date
    this.updateSubscriptionDates(this.subscriptionStartDate, endStr);
  }

  validateAllPeriods(): ValidationResult {
    return this.periodService.validatePeriods(this.periods);
  }

  submitQuote(): void {
    const validation = this.validateAllPeriods();
    if (!validation.isValid || this.periods.length === 0 || this.detailsForm.invalid) {
      return; 
    }

    const payload = {
      ...this.detailsForm.getRawValue(),
      periods: this.periods
    };

    const quoteId = sessionStorage.getItem('selectedQuoteId') || 'unknown';

    this.crmService.submitQuoteDetails(quoteId, payload).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/opportunities']);
      }
    });
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
    return this.periods.length === 0 || this.detailsForm.invalid;
  }

  getChildBasePrice(name: string): string {
    switch (name) {
      case 'Standard User': return '$30 / Year';
      case 'Developer User': return '$60 / Year';
      case 'Viewer User': return '$30 / Year';
      case 'Non-prod': return '$416.67 / Year';
      default: return '$0 / Year';
    }
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
    const targetState = !period.expanded;
    // Collapse all other periods to prevent overflow
    this.periods.forEach(p => p.expanded = false);
    period.expanded = targetState;
  }
}

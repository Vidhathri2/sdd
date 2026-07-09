import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CrmService } from '../../services/crm.service';
import { PeriodService, Period, ValidationResult } from '../../services/period.service';

@Component({
  selector: 'app-quote-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quote-wizard.component.html',
  styleUrls: ['./quote-wizard.component.css']
})
export class QuoteWizardComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private crmService: CrmService,
    private periodService: PeriodService,
    private router: Router
  ) {
    this.detailsForm = this.fb.group({
      primaryContact: ['', Validators.required],
      salesChannel: ['Direct', Validators.required],
      operationType: ['New', Validators.required],
      quoteExpirationDate: ['', Validators.required],
      billingFrequency: ['', Validators.required],
      termStartsOn: ['', Validators.required],
      termStartDate: ['', Validators.required],
      termEndDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPicklists();

    const quoteId = sessionStorage.getItem('selectedQuoteId');
    if (quoteId) {
      this.crmService.getQuoteDetails(quoteId).subscribe(details => {
        this.quoteDetails = details;
        this.paymentAccount = details.paymentAccount;

        // Default expiration date to 45 days from now
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 45);
        const expStr = expDate.toISOString().split('T')[0];

        this.detailsForm.patchValue({
          primaryContact: details.primaryContact,
          salesChannel: details.salesChannel,
          operationType: 'New',
          quoteExpirationDate: expStr,
          billingFrequency: details.billingFrequency,
          termStartsOn: details.termStartsOn,
          termStartDate: details.termStartDate,
          termEndDate: details.termEndDate
        });

        this.subscriptionStartDate = details.termStartDate;
        this.subscriptionEndDate = details.termEndDate;
      });
    }

    // Sync tab 1 to tab 2 dates
    this.detailsForm.get('termStartDate')?.valueChanges.subscribe(val => {
      this.subscriptionStartDate = val;
    });
    this.detailsForm.get('termEndDate')?.valueChanges.subscribe(val => {
      this.subscriptionEndDate = val;
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
    if (mode === 'Yearly') {
      this.periods = this.periodService.generateYearlyPeriods(
        this.subscriptionStartDate, 
        this.subscriptionEndDate
      );
    } else {
      this.periods = this.periodService.generateCustomPeriods(
        this.subscriptionStartDate,
        this.subscriptionEndDate,
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

    this.periods.push({
      name: `Period ${this.periods.length + 1}`,
      startDate: startStr,
      endDate: endStr,
      platformProduct: '',
      discount: 0,
      childProducts: []
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
      ...this.detailsForm.value,
      periods: this.periods
    };

    const quoteId = sessionStorage.getItem('selectedQuoteId') || 'unknown';

    this.crmService.submitQuoteDetails(quoteId, payload).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/opportunities']);
      }
    });
  }

  get isSubmitDisabled(): boolean {
    return this.periods.length === 0 || this.detailsForm.invalid;
  }
}

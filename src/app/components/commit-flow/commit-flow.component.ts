import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectProductsModalComponent } from '../select-products-modal/select-products-modal.component';
import { UploadProductsModalComponent } from '../upload-products-modal/upload-products-modal.component';
import { QuotePreviewModalComponent } from '../quote-preview-modal/quote-preview-modal.component';

export interface CommitmentPeriod {
  months: string | null;
  amount: number | null;
  amountStr?: string;
  isCollapsed: boolean;
}

export interface DiscountPeriod {
  id: number;
  timePeriod: string;
  startDate: string;
  endDate: string;
  granularity: 'Overall' | 'Granular';
  discountType: string;
  priceReference: string;
  overallDiscount: string;
  products: any[];
}

export interface IncentivePeriod {
  id: number;
  timePeriod: string;
  startDate: string;
  endDate: string;
  type: string;
  products: any[];
}

import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-commit-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectProductsModalComponent, UploadProductsModalComponent, QuotePreviewModalComponent],
  templateUrl: './commit-flow.component.html',
  styleUrl: './commit-flow.component.css'
})
export class CommitFlowComponent {
  @Input() detailsForm!: FormGroup;
  @Input() paymentAccount: any;
  @Input() quoteDetails: any;
  
  @Output() totalsChanged = new EventEmitter<{months: number, amount: number}>();

  constructor(private crmService: CrmService, private router: Router) {}

  activeTab: 'details' | 'discounts' = 'details';
  commitmentPeriods: CommitmentPeriod[] = [
    { months: '', amount: null, amountStr: '', isCollapsed: false }
  ];
  
  // --- Discounts & Incentives State ---
  rightPanelTab: 'Discounts' | 'Incentives' = 'Discounts';
  
  discountPeriods: DiscountPeriod[] = [
    { id: 1, timePeriod: 'Date range', startDate: '', endDate: '', granularity: 'Overall', discountType: 'Flat rate (%)', priceReference: 'Select', overallDiscount: '', products: [] }
  ];
  
  incentivePeriods: IncentivePeriod[] = [
    { id: 1, timePeriod: 'Date range', startDate: '', endDate: '', type: 'Incentives type 1', products: [] }
  ];

  // Right Panel form bindings
  selectedDiscountPeriodId: number = 1;
  configDiscountGranularity: 'Overall' | 'Granular' = 'Overall';
  configDiscountType: string = 'Flat rate (%)';
  configPriceReference: string = 'Select';
  configOverallDiscount: string = '';

  selectedIncentivePeriodId: number = 1;
  configIncentiveType: string = 'Incentives type 1';

  // Temporary selection from modal
  tempSelectedProducts: any[] = [];

  // Modal states
  showSelectProductsModal = false;
  showUploadProductsModal = false;
  showQuotePreviewModal = false;
  showSuccessModal = false;

  // Submit state
  isSubmitting = false;
  isApplyingDiscount = false;
  toastMessage: string | null = null;
  toastType: 'error' | 'success' | 'info' = 'error';

  showToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = null; }, 4000);
  }

  parseAmountString(valStr: string): number {
    if (!valStr) return 0;
    // Remove $, commas, and whitespace
    const cleaned = valStr.replace(/[$,\s]/g, '').trim();
    if (!cleaned) return 0;

    const lastChar = cleaned.charAt(cleaned.length - 1).toLowerCase();
    const numericPart = cleaned.slice(0, -1);

    if (lastChar === 'k') {
      return (parseFloat(numericPart) || 0) * 1000;
    } else if (lastChar === 'm') {
      return (parseFloat(numericPart) || 0) * 1000000;
    } else if (lastChar === 'b') {
      return (parseFloat(numericPart) || 0) * 1000000000;
    }

    return parseFloat(cleaned) || 0;
  }

  formatPeriodAmount(period: any): void {
    if (!period.amountStr) return;
    const parsed = this.parseAmountString(period.amountStr);
    if (parsed > 0) {
      period.amountStr = parsed.toLocaleString('en-US');
      this.calculateTotals();
    }
  }

  getProductGroupsCount(products: any[]): number {
    if (!products) return 0;
    return products.filter(p => p.family === 'Classification' || p.family === 'Product Group').length;
  }

  getIndividualProductsCount(products: any[]): number {
    if (!products) return 0;
    return products.filter(p => p.family !== 'Classification' && p.family !== 'Product Group').length;
  }

  getTodayDateFormatted(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  calculateTotals(): void {
    // Small timeout ensures the model is fully updated before calculating
    setTimeout(() => {
      let totalMonths = 0;
      let totalAmount = 0;

      for (const p of this.commitmentPeriods) {
        if (p.months) {
          totalMonths += parseInt(p.months, 10) || 0;
        }
        if (p.amountStr) {
          const amt = this.parseAmountString(p.amountStr);
          totalAmount += amt;
        }
      }

      this.totalsChanged.emit({ months: totalMonths, amount: totalAmount });
    });
  }

  addCommitPeriod(): void {
    if (this.commitmentPeriods.length < 5) {
      this.commitmentPeriods.push({ months: '', amount: null, amountStr: '', isCollapsed: false });
      this.calculateTotals();
    }
  }

  duplicatePeriod(index: number): void {
    if (this.commitmentPeriods.length < 5) {
      const p = this.commitmentPeriods[index];
      this.commitmentPeriods.splice(index + 1, 0, {
        months: p.months,
        amount: p.amount,
        amountStr: p.amountStr,
        isCollapsed: false
      });
      this.calculateTotals();
    }
  }

  deletePeriod(index: number): void {
    if (this.commitmentPeriods.length > 1) {
      this.commitmentPeriods.splice(index, 1);
      this.calculateTotals();
    }
  }

  // --- Discounts & Incentives Logic ---

  addNewDiscountPeriod(): void {
    const nextId = this.discountPeriods.length > 0 ? Math.max(...this.discountPeriods.map(p => p.id)) + 1 : 1;
    this.discountPeriods.push({
      id: nextId,
      timePeriod: 'Date range',
      startDate: '',
      endDate: '',
      granularity: 'Overall',
      discountType: 'Flat rate (%)',
      priceReference: 'Select',
      overallDiscount: '',
      products: []
    });
  }

  selectDiscountPeriod(id: number): void {
    this.selectedDiscountPeriodId = id;
    this.rightPanelTab = 'Discounts';
  }

  selectIncentivePeriod(id: number): void {
    this.selectedIncentivePeriodId = id;
    this.rightPanelTab = 'Incentives';
  }

  // Loading state for discount/incentive apply
  configIncentiveAmount: string = '';

  openSelectProductsModal(): void {
    const currentProducts = this.rightPanelTab === 'Discounts'
        ? this.discountPeriods.find(p => p.id == this.selectedDiscountPeriodId)?.products || []
        : this.incentivePeriods.find(p => p.id == this.selectedIncentivePeriodId)?.products || [];
    this.tempSelectedProducts = [...currentProducts];
    this.showSelectProductsModal = true;
  }

  onProductsConfirmed(products: any[]): void {
    this.tempSelectedProducts = products;
    this.showSelectProductsModal = false;
  }

  applyDiscountConfiguration(): void {
    const period = this.discountPeriods.find(p => p.id == this.selectedDiscountPeriodId);
    if (!period) {
      this.showToast('No discount period selected.', 'error');
      return;
    }

    // Validate: products required for Granular mode
    if (this.configDiscountGranularity === 'Granular' && this.tempSelectedProducts.length === 0) {
      this.showToast('Please select at least one product before applying a granular discount.', 'error');
      return;
    }

    // Validate: discount value must be filled
    const discountVal = parseFloat(this.configOverallDiscount);
    if (!this.configOverallDiscount || isNaN(discountVal) || discountVal < 0) {
      this.showToast('Please enter a valid discount value before applying.', 'error');
      return;
    }

    // Step 1 — Update local state immediately
    period.granularity = this.configDiscountGranularity;
    period.discountType = this.configDiscountType;
    period.priceReference = this.configPriceReference;
    period.overallDiscount = this.configOverallDiscount;
    period.products = [...this.tempSelectedProducts];

    const productsToApply = this.tempSelectedProducts.length > 0
      ? this.tempSelectedProducts
      : period.products;

    if (productsToApply.length === 0) {
      this.showToast(`Discount of ${discountVal}% configured for ${period.timePeriod}. Select products to apply to Salesforce.`, 'info');
      this.tempSelectedProducts = [];
      return;
    }

    this.isApplyingDiscount = true;

    // Step 2 — Fire the refactored API which queries existing lines and does POST/PATCH as needed
    this.crmService.applyBulkDiscounts(
      discountVal,
      'Discount',
      productsToApply,
      period.startDate,
      period.endDate
    ).subscribe({
      next: (res) => {
        this.isApplyingDiscount = false;
        console.log('[AddDiscount] Success:', res);
        const label = this.configDiscountType === 'Flat rate (%)' ? `${discountVal}%` : `$${discountVal}`;
        this.showToast(`Discount of ${label} successfully applied to ${productsToApply.length} product(s).`, 'success');
        this.tempSelectedProducts = [];
      },
      error: (err) => {
        this.isApplyingDiscount = false;
        console.error('[AddDiscount] Error:', err);
        const label = this.configDiscountType === 'Flat rate (%)' ? `${discountVal}%` : `$${discountVal}`;
        this.showToast(`Discount of ${label} saved locally. Salesforce sync failed.`, 'info');
        this.tempSelectedProducts = [];
      }
    });
  }

  applyIncentiveConfiguration(): void {
    const period = this.incentivePeriods.find(p => p.id == this.selectedIncentivePeriodId);
    if (!period) {
      this.showToast('No incentive period selected.', 'error');
      return;
    }

    if (this.tempSelectedProducts.length === 0) {
      this.showToast('Please select at least one product before adding an incentive.', 'error');
      return;
    }

    const incentiveVal = parseFloat(this.configIncentiveAmount);
    if (!this.configIncentiveAmount || isNaN(incentiveVal) || incentiveVal < 0) {
      this.showToast('Please enter a valid incentive amount before applying.', 'error');
      return;
    }

    // Update local state
    period.type = this.configIncentiveType;
    period.products = [...this.tempSelectedProducts];

    this.isApplyingDiscount = true;

    // Fire the refactored API which queries existing lines and does POST/PATCH as needed
    this.crmService.applyBulkDiscounts(
      incentiveVal,
      'Incentive',
      this.tempSelectedProducts,
      period.startDate,
      period.endDate
    ).subscribe({
      next: (res) => {
        this.isApplyingDiscount = false;
        console.log('[AddIncentive] Success:', res);
        this.showToast(`Incentive of $${incentiveVal} successfully applied to ${this.tempSelectedProducts.length} product(s).`, 'success');
        this.tempSelectedProducts = [];
        this.configIncentiveAmount = '';
      },
      error: (err) => {
        this.isApplyingDiscount = false;
        console.error('[AddIncentive] Error:', err);
        this.showToast(`Incentive saved locally. Salesforce sync failed.`, 'info');
        this.tempSelectedProducts = [];
        this.configIncentiveAmount = '';
      }
    });
  }


  canNavigateToDiscounts(): boolean {
    if (this.commitmentPeriods.length === 0) return false;
    const hasInvalidPeriod = this.commitmentPeriods.some(p => !p.months || !p.amountStr);
    return !hasInvalidPeriod;
  }

  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.canNavigateToDiscounts();
  }

  submitQuote(): void {
    // Step 1: Validate the form
    if (this.detailsForm && this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      this.showToast('Please fill in all required fields before submitting.', 'error');
      this.activeTab = 'details';
      return;
    }

    // Step 2: Validate commitment periods
    const hasInvalidPeriod = this.commitmentPeriods.some(p => !p.months || !p.amountStr);
    if (hasInvalidPeriod) {
      this.showToast('Please fill in Period (months) and Amount for all commitment periods.', 'error');
      this.activeTab = 'details';
      return;
    }

    // Step 3: Build Commitment Details tree records
    const quoteId = sessionStorage.getItem('selectedQuoteId') || 'unknown';
    const bundleLineItemId = sessionStorage.getItem('mockBundleLineItemId') || 'unknown';
    const expirationDate = this.detailsForm?.get('quoteExpirationDate')?.value || '';

    const treeRecords: any[] = [];
    let runningDate = new Date();

    this.commitmentPeriods.forEach((p, idx) => {
      const months = parseInt(p.months || '0', 10) || 0;
      const startStr = runningDate.toISOString().split('T')[0];
      const endDate = new Date(runningDate);
      endDate.setMonth(endDate.getMonth() + months);
      const endStr = endDate.toISOString().split('T')[0];

      treeRecords.push({
        attributes: {
          type: 'Commitment_Details__c',
          referenceId: `ref${idx + 1}`
        },
        Name: `Commitperiod${idx + 2}`,
        Periods_Months__c: (p.months || '').toString(),
        Quote__c: quoteId,
        Quote_Line_Item__c: bundleLineItemId,
        Commit_Amount__c: this.parseAmountString(p.amountStr || '').toString(),
        Start_Date__c: startStr,
        End_Date__c: endStr
      });

      const nextDate = new Date(endDate);
      nextDate.setDate(nextDate.getDate() + 1);
      runningDate = nextDate;
    });

    // Step 4: Build standard composite graph payload
    const records: any[] = [
      {
        referenceId: 'refQuote',
        record: {
          attributes: { type: 'Quote', method: 'PATCH', id: quoteId },
          ExpirationDate: expirationDate
        }
      },
      {
        referenceId: 'refLineUpdate',
        record: {
          attributes: { type: 'QuoteLineItem', method: 'PATCH', id: bundleLineItemId },
          Commitment_Term__c: this.commitmentPeriods.map(p => p.months).join(','),
          Commitment_Amount__c: this.commitmentPeriods.reduce((sum, p) => {
            return sum + this.parseAmountString(p.amountStr || '');
          }, 0)
        }
      }
    ];

    const payload = {
      pricingPref: 'System',
      catalogRatesPref: 'Skip',
      configurationPref: {
        configurationMethod: 'Skip',
        configurationOptions: {
          validateProductCatalog: true,
          executeConfigurationRules: false,
          addDefaultConfiguration: false
        }
      },
      taxPref: 'Skip',
      contextDetails: {},
      graph: { graphId: 'updateCommitQuote', records }
    };

    console.log('[CommitFlow Submit] Commitment Details Payload:', JSON.stringify(treeRecords, null, 2));
    console.log('[CommitFlow Submit] Composite Graph Payload:', JSON.stringify(payload, null, 2));

    this.isSubmitting = true;

    // Call commitment details creation first
    this.crmService.createCommitmentDetails(treeRecords).subscribe({
      next: (treeRes) => {
        if (treeRes && treeRes.hasErrors) {
          this.isSubmitting = false;
          this.showToast('Failed to save commitment period details in Salesforce.', 'error');
          return;
        }

        // Proceed to submit the main quote details
        this.crmService.submitQuoteDetails(payload).subscribe({
          next: (res) => {
            this.isSubmitting = false;
            if (res && (res.isSuccess || res.success)) {
              const bundleProductId = sessionStorage.getItem('mockConfiguredProductId') || '01tDz00000Eah7vIAB';
              this.crmService.getProductClassifications(bundleProductId).subscribe({
                next: (classifications) => {
                  console.log('[CommitFlow Submit] Successfully fetched ProductClassifications post-submit:', classifications);
                  this.showSuccessModal = true;
                },
                error: (err) => {
                  console.warn('[CommitFlow Submit] Failed to fetch ProductClassifications post-submit:', err);
                  this.showSuccessModal = true;
                }
              });
            } else {
              const msg = res?.errorResponse?.[0]?.message
                || res?.errors?.[0]?.message
                || res?.message
                || 'Quote submission failed. Please review your configuration and try again.';
              this.showToast(msg, 'error');
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            const msg = error?.error?.[0]?.message
              || error?.error?.message
              || error?.message
              || 'An unexpected error occurred during submission. Please try again.';
            console.error('[CommitFlow Submit] Error:', error);
            this.showToast(msg, 'error');
          }
        });
      },
      error: (treeErr) => {
        this.isSubmitting = false;
        console.error('[CommitFlow Submit] Commitment Tree Error:', treeErr);
        this.showToast('Failed to create commitment period records in Salesforce.', 'error');
      }
    });
  }

  onSuccessModalOk(): void {
    this.showSuccessModal = false;
    sessionStorage.clear();
    this.router.navigate(['/opportunities']);
  }
}

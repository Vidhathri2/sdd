import { Component, Input, Output, EventEmitter, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
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
          const amt = parseFloat(p.amountStr.replace(/,/g, '')) || 0;
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

  openSelectProductsModal(): void {
    // Determine which periods we are configuring based on the active right tab
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
    if (period) {
      period.granularity = this.configDiscountGranularity;
      period.discountType = this.configDiscountType;
      period.priceReference = this.configPriceReference;
      period.overallDiscount = this.configOverallDiscount;
      period.products = [...this.tempSelectedProducts];
      
      // Clear temp selection
      this.tempSelectedProducts = [];
    }
  }

  applyIncentiveConfiguration(): void {
    const period = this.incentivePeriods.find(p => p.id == this.selectedIncentivePeriodId);
    if (period) {
      period.type = this.configIncentiveType;
      period.products = [...this.tempSelectedProducts];
      
      // Clear temp selection
      this.tempSelectedProducts = [];
    }
  }

  canNavigateToDiscounts(): boolean {
    if (this.commitmentPeriods.length === 0) return false;
    // Check if any period has empty required fields (using amountStr since it's bound in HTML)
    const hasInvalidPeriod = this.commitmentPeriods.some(p => !p.months || !p.amountStr);
    return !hasInvalidPeriod;
  }
}

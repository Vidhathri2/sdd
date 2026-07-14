import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-quote-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-preview-modal.component.html',
  styleUrl: './quote-preview-modal.component.css'
})
export class QuotePreviewModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  @Input() commitmentPeriods: any[] = [];
  @Input() discountPeriods: any[] = [];
  @Input() incentivePeriods: any[] = [];
  @Input() quoteDetails: any;

  sessionAccountName: string = '';
  sessionOpportunityName: string = '';
  sessionConfiguredProduct: string = '';

  isLoading: boolean = false;
  previewData: any = null;
  sfDiscountPeriods: any[] = [];
  sfIncentivePeriods: any[] = [];
  sfProducts: any[] = [];

  constructor(private crmService: CrmService) {}

  ngOnInit() {
    this.sessionAccountName = sessionStorage.getItem('selectedAccountName') || '';
    this.sessionOpportunityName = sessionStorage.getItem('selectedOpportunityName') || '';
    this.sessionConfiguredProduct = sessionStorage.getItem('mockConfiguredProduct') || '';

    const quoteId = this.quoteDetails?.Id || sessionStorage.getItem('selectedQuoteId');
    if (quoteId) {
      this.isLoading = true;
      this.crmService.getQuotePreview(quoteId).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res && res.records && res.records.length > 0) {
            this.previewData = res.records[0];
            if (this.previewData.QuoteLineItems && this.previewData.QuoteLineItems.records) {
              this.parseQuoteLineItems(this.previewData.QuoteLineItems.records);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.warn('[QuotePreviewModal] Failed to fetch quote preview from Salesforce', err);
        }
      });
    }
  }

  get totalCommitmentMonths(): number {
    return this.commitmentPeriods.reduce((sum, p) => sum + (parseInt(p.months) || 0), 0);
  }

  get totalCommitmentValue(): number {
    return this.commitmentPeriods.reduce((sum, p) => {
      if (!p.amountStr) return sum;
      return sum + parseFloat(p.amountStr.replace(/,/g, ''));
    }, 0);
  }

  get totalIncentivesValue(): number {
    if (this.previewData && this.previewData.QuoteLineItems && this.previewData.QuoteLineItems.records) {
      return this.previewData.QuoteLineItems.records.reduce((sum: number, item: any) => {
        // Sum up either numerical Incentive__c value or parse if it has string notation
        const val = item.Incentive__c;
        if (typeof val === 'number') return sum + val;
        if (typeof val === 'string') {
          return sum + (parseFloat(val.replace(/[$,\s]/g, '')) || 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  }

  parseQuoteLineItems(records: any[]): void {
    if (!records || records.length === 0) return;

    // 1. Find main bundle products (Type = Bundle or Name contains GCP/Platform)
    const bundleItems = records.filter(item => 
      item.Product2?.Name === 'Google Cloud Platform RCA' || 
      item.Product2?.Name === 'Google Cloud Platform' ||
      item.Product2?.Type === 'Bundle' ||
      (item.Product2?.Name && item.Product2.Name.toLowerCase().includes('platform'))
    );
    if (bundleItems.length > 0) {
      this.sfProducts = bundleItems.map(item => ({
        name: item.Product2?.Name,
        quantity: item.Quantity || 1,
        discount: item.Discount || 0
      }));
    }

    // 2. Extract discount periods (group items where item.Discount != null by StartDate & EndDate)
    const discountItems = records.filter(item => item.Discount !== null && item.Discount !== undefined && item.Discount !== '');
    const discountGroupsMap = new Map<string, any>();
    discountItems.forEach(item => {
      const key = `${item.StartDate}_${item.EndDate}`;
      if (!discountGroupsMap.has(key)) {
        discountGroupsMap.set(key, {
          startDate: item.StartDate,
          endDate: item.EndDate,
          discountType: 'Flat rate (%)',
          overallDiscount: `${item.Discount}%`,
          granularity: 'Overall',
          products: []
        });
      }
      const group = discountGroupsMap.get(key);
      group.products.push({ 
        name: item.Product2?.Name,
        discount: item.Discount
      });
    });
    
    this.sfDiscountPeriods = Array.from(discountGroupsMap.values()).map((g, idx) => ({
      id: idx + 1,
      ...g
    }));

    // 3. Extract incentive periods (group items where item.Incentive__c != null by StartDate & EndDate)
    const incentiveItems = records.filter(item => item.Incentive__c !== null && item.Incentive__c !== undefined && item.Incentive__c !== '');
    const incentiveGroupsMap = new Map<string, any>();
    incentiveItems.forEach(item => {
      const key = `${item.StartDate}_${item.EndDate}`;
      if (!incentiveGroupsMap.has(key)) {
        incentiveGroupsMap.set(key, {
          startDate: item.StartDate,
          endDate: item.EndDate,
          type: 'Incentives type 1',
          products: []
        });
      }
      const group = incentiveGroupsMap.get(key);
      group.products.push({ 
        name: item.Product2?.Name,
        incentive: item.Incentive__c
      });
    });

    this.sfIncentivePeriods = Array.from(incentiveGroupsMap.values()).map((g, idx) => ({
      id: idx + 1,
      ...g
    }));
  }

  closeModal() {
    this.close.emit();
  }
}

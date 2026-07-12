import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  ngOnInit() {
    this.sessionAccountName = sessionStorage.getItem('selectedAccountName') || '';
    this.sessionOpportunityName = sessionStorage.getItem('selectedOpportunityName') || '';
    this.sessionConfiguredProduct = sessionStorage.getItem('mockConfiguredProduct') || '';
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

  closeModal() {
    this.close.emit();
  }
}

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService, Product } from '../../services/crm.service';

export interface ModalProduct extends Product {
  selected: boolean;
  value: string;
}

@Component({
  selector: 'app-select-products-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-products-modal.component.html',
  styleUrl: './select-products-modal.component.css'
})
export class SelectProductsModalComponent implements OnInit {
  @Input() mode: 'Discount' | 'Incentive' = 'Discount';
  @Input() granularity: 'Overall' | 'Granular' = 'Overall';
  @Input() initialSelectedProducts: any[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any[]>();

  products: ModalProduct[] = [];
  filter: 'All' | 'Selected' = 'All';

  constructor(private crmService: CrmService) {}

  ngOnInit(): void {
    this.crmService.getProducts().subscribe(apiProducts => {
      this.products = apiProducts.map(p => {
        const preselected = this.initialSelectedProducts.find(ip => ip.id === p.id);
        return {
          ...p,
          selected: !!preselected,
          value: preselected ? preselected.value : ''
        };
      });
    });
  }

  get filteredProducts(): ModalProduct[] {
    if (this.filter === 'Selected') {
      return this.products.filter(p => p.selected);
    }
    return this.products;
  }

  get selectedCount(): number {
    return this.products.filter(p => p.selected).length;
  }

  isValidToConfirm(): boolean {
    const selected = this.products.filter(p => p.selected);
    if (selected.length === 0) return true; // allow empty selection
    
    if (this.mode === 'Incentive' || (this.mode === 'Discount' && this.granularity === 'Granular')) {
      // If granular/incentive, ensure a value is typed for all selected
      return selected.every(p => p.value && p.value.trim().length > 0);
    }
    return true;
  }

  onConfirm(): void {
    if (this.isValidToConfirm()) {
      const selected = this.products.filter(p => p.selected).map(p => ({
        id: p.id,
        name: p.name,
        family: p.family,
        value: p.value
      }));
      this.confirm.emit(selected);
    }
  }
}

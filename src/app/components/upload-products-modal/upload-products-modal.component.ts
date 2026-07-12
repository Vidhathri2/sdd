import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-upload-products-modal',
  standalone: true,
  imports: [],
  templateUrl: './upload-products-modal.component.html',
  styleUrl: './upload-products-modal.component.css'
})
export class UploadProductsModalComponent {
  @Output() close = new EventEmitter<void>();
}

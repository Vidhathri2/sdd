import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductDiscoveryComponent } from '../src/app/components/product-discovery/product-discovery.component';
import { CrmService, Product } from '../src/app/services/crm.service';

describe('ProductDiscoveryComponent (Angular & Tailwind)', () => {
  let component: ProductDiscoveryComponent;
  let fixture: ComponentFixture<ProductDiscoveryComponent>;
  let mockCrmService: jasmine.SpyObj<CrmService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const dummyProducts: Product[] = [
    { id: 'prod-1', name: 'Chrome OS', family: 'Chrome', icon: 'Chrome' },
    { id: 'prod-2', name: 'Google Cloud Platform', family: 'GCP', icon: 'GCP' },
    { id: 'prod-3', name: 'Google Maps Platform', family: 'Maps', icon: 'Maps' },
    { id: 'prod-4', name: 'Google Workspace', family: 'Workspace', icon: 'Workspace' },
    { id: 'prod-5', name: 'Looker Core', family: 'GCP', icon: 'GCP' },
    { id: 'prod-6', name: 'PSO Services', family: 'PSO', icon: 'PSO' }
  ];

  beforeEach(async () => {
    mockCrmService = jasmine.createSpyObj('CrmService', ['getProducts', 'createQuote', 'getQuoteDetails']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Mock sessionStorage
    const store: { [key: string]: string } = {
      selectedOpportunityId: 'opp-id-123',
      selectedAccountName: 'Acme Corp',
      selectedOpportunityName: 'Acme Expansion',
      selectedPrimaryContact: 'John Doe'
    };
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(sessionStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    await TestBed.configureTestingModule({
      imports: [ProductDiscoveryComponent],
      providers: [
        { provide: CrmService, useValue: mockCrmService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    mockCrmService.getProducts.and.returnValue(of(dummyProducts));
    fixture = TestBed.createComponent(ProductDiscoveryComponent);
    component = fixture.componentInstance;
  });

  describe('1. UI Structure & Product Catalogue Layout', () => {
    it('should render page title, search bar, and back button', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      const titleEl = element.querySelector('.page-title');
      expect(titleEl?.textContent?.trim()).toContain('Select products');

      const searchInput = element.querySelector('input[placeholder="Search by keyword"]');
      expect(searchInput).toBeTruthy();

      const backBtn = element.querySelector('.back-btn');
      expect(backBtn).toBeTruthy();
    });

    it('should display the product family filters in the sidebar', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      const sidebarItems = element.querySelectorAll('.sidebar-filter');
      expect(sidebarItems.length).toBeGreaterThanOrEqual(5);

      const texts = Array.from(sidebarItems).map(item => item.textContent?.trim());
      expect(texts).toContain('GCP');
      expect(texts).toContain('Workspace');
      expect(texts).toContain('Chrome');
      expect(texts).toContain('Maps');
      expect(texts).toContain('PSO');
    });

    it('should render all products in the main panel catalog by default', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      const cards = element.querySelectorAll('.product-card');
      expect(cards.length).toBe(6);
    });
  });

  describe('2. Sidebar Filtering & Keyword Search', () => {
    it('should filter product cards when clicking on a sidebar family', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      // Click on "GCP" filter
      const sidebarItems = element.querySelectorAll('.sidebar-filter');
      const gcpFilter = Array.from(sidebarItems).find(item => item.textContent?.trim() === 'GCP') as HTMLElement;
      expect(gcpFilter).toBeTruthy();

      gcpFilter.click();
      fixture.detectChanges();

      const cards = element.querySelectorAll('.product-card');
      expect(cards.length).toBe(2); // Only Google Cloud Platform and Looker Core

      const names = Array.from(cards).map(card => card.querySelector('.product-name')?.textContent?.trim());
      expect(names).toContain('Google Cloud Platform');
      expect(names).toContain('Looker Core');
    });

    it('should filter product cards based on keyword search input', fakeAsync(() => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      const searchInput: HTMLInputElement | null = element.querySelector('input[placeholder="Search by keyword"]');
      expect(searchInput).toBeTruthy();

      if (searchInput) {
        searchInput.value = 'workspace';
        searchInput.dispatchEvent(new Event('input'));
      }
      tick(300); // Debounce
      fixture.detectChanges();

      const cards = element.querySelectorAll('.product-card');
      expect(cards.length).toBe(1);
      expect(cards[0].querySelector('.product-name')?.textContent?.trim()).toBe('Google Workspace');
    }));
  });

  describe('3. Cart & Added Products lifecycle', () => {
    it('should add products to cart and update card button style', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      // Cart drawer should be hidden/closed initially (no products added yet)
      let cartDrawer = element.querySelector('.cart-drawer');
      expect(cartDrawer).toBeNull();

      // Click add button on second product card (Google Cloud Platform)
      const addBtns = element.querySelectorAll('.add-btn');
      (addBtns[1] as HTMLElement).click();
      fixture.detectChanges();

      // Cart drawer should be open and display the added product
      cartDrawer = element.querySelector('.cart-drawer');
      expect(cartDrawer).toBeTruthy();

      const addedItems = element.querySelectorAll('.added-product-item');
      expect(addedItems.length).toBe(1);
      expect(addedItems[0].textContent?.trim()).toContain('Google Cloud Platform');

      // The button text on the card should update to "✓ Added"
      const updatedBtn = element.querySelectorAll('.product-card')[1].querySelector('.add-btn');
      expect(updatedBtn?.textContent?.trim()).toContain('Added');
      expect(updatedBtn?.getAttribute('disabled')).not.toBeNull();
    });

    it('should close the cart drawer when clicking the close button', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      // Add a product to open the drawer
      const addBtns = element.querySelectorAll('.add-btn');
      (addBtns[0] as HTMLElement).click();
      fixture.detectChanges();

      expect(element.querySelector('.cart-drawer')).toBeTruthy();

      // Click close button
      const closeBtn = element.querySelector('.close-cart-btn') as HTMLElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      fixture.detectChanges();

      expect(element.querySelector('.cart-drawer')).toBeNull();
    });
  });

  describe('4. Quote Placement & Redirection', () => {
    it('should call APIs and navigate to quote-details on continue', () => {
      mockCrmService.createQuote.and.returnValue(of({ salesTransactionId: 'quote-12345', success: true, errors: [] }));
      mockCrmService.getQuoteDetails.and.returnValue(of({
        Id: 'quote-12345',
        Name: 'Mock Quote',
        QuoteNumber: 'Q-000025',
        OpportunityId: 'opp-id-123'
      }));

      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;

      // Add Looker Core product to cart
      const addBtns = element.querySelectorAll('.add-btn');
      (addBtns[4] as HTMLElement).click();
      fixture.detectChanges();

      // Click Continue
      const continueBtn = element.querySelector('.continue-btn') as HTMLElement;
      expect(continueBtn).toBeTruthy();
      continueBtn.click();
      fixture.detectChanges();

      // Check API calls
      expect(mockCrmService.createQuote).toHaveBeenCalledWith('opp-id-123', ['prod-5']);
      expect(mockCrmService.getQuoteDetails).toHaveBeenCalledWith('quote-12345');

      // Verify Session Storage update with Quote Details
      expect(sessionStorage.setItem).toHaveBeenCalledWith('createdQuoteId', 'quote-12345');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('createdQuoteNumber', 'Q-000025');

      // Verify redirection
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/quote-details']);
    });
  });
});

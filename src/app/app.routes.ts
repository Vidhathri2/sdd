import { Routes } from '@angular/router';
import { OpportunityListComponent } from './components/opportunity-list/opportunity-list.component';
import { ProductDiscoveryComponent } from './components/product-discovery/product-discovery.component';
import { QuoteWizardComponent } from './components/quote-wizard/quote-wizard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'opportunities', pathMatch: 'full' },
  { path: 'opportunities', component: OpportunityListComponent },
  { path: 'product-selection', component: ProductDiscoveryComponent },
  { path: 'quote-details', component: OpportunityListComponent }, // Temporary placeholder
  { path: 'configure-quote', component: QuoteWizardComponent }
];

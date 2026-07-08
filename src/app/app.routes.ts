import { Routes } from '@angular/router';
import { OpportunityListComponent } from './components/opportunity-list/opportunity-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'opportunities', pathMatch: 'full' },
  { path: 'opportunities', component: OpportunityListComponent }
];


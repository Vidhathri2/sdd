import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  owner: string;
  amount: number;
  closeDate: string;
  primaryContact: string;
}

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private baseUrl = 'https://vector--rcaagivant.sandbox.my.salesforce.com';

  constructor(private http: HttpClient) {}

  getOpportunities(): Observable<Opportunity[]> {
    const query = `SELECT Id,Name,StageName,Amount,CloseDate,Owner.Name,AccountId,Account.Name,Account.Website,CreatedDate,(SELECT Contact.Id,Contact.Name FROM OpportunityContactRoles) FROM Opportunity WHERE CreatedDate>=2026-01-28T00:00:00Z ORDER BY CreatedDate DESC LIMIT 5`;
    const url = `${this.baseUrl}/services/data/v65.0/query?q=${encodeURIComponent(query)}`;

    return this.http.get<{ records: any[] }>(url).pipe(
      map(response => this.mapSalesforceRecords(response.records || [])),
      catchError(error => {
        console.warn('Salesforce API request failed. Falling back to local mock data.', error);
        return of(this.getMockOpportunities());
      })
    );
  }

  private mapSalesforceRecords(records: any[]): Opportunity[] {
    return records.map(rec => {
      let primaryContact = '';
      const contactRoles = rec.OpportunityContactRoles?.records;
      if (contactRoles && contactRoles.length > 0) {
        primaryContact = contactRoles[0].Contact?.Name || '';
      }
      return {
        id: rec.Id || '',
        name: rec.Name || '',
        accountName: rec.Account?.Name || '',
        owner: rec.Owner?.Name || '',
        amount: rec.Amount || 0,
        closeDate: rec.CloseDate || '',
        primaryContact: primaryContact
      };
    });
  }

  private getMockOpportunities(): Opportunity[] {
    return Array.from({ length: 33 }, (_, i) => ({
      id: `opp-id-${i + 1}`,
      name: `Opportunity Name ${i + 1}`,
      accountName: `Account Name ${i + 1}`,
      owner: `Owner ${i + 1}`,
      amount: 10000 * (i + 1),
      closeDate: `2026-07-0${(i % 9) + 1}`,
      primaryContact: `Sarah Connor ${i + 1}`
    }));
  }
}

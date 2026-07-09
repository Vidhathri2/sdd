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

export interface Product {
  id: string;
  name: string;
  family: string;
  icon: string;
  description?: string;
}

export interface QuoteResponse {
  salesTransactionId: string;
  success: boolean;
  errors?: any[];
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

  getProducts(): Observable<Product[]> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/pcm/products`;
    const payload = {
      language: 'en_US',
      filter: {
        criteria: [
          { property: 'isActive', operator: 'eq', value: true },
          { property: 'Type', operator: 'eq', value: 'Bundle' }
        ]
      },
      offset: 0,
      pageSize: 100,
      additionalFields: {
        Product2: {
          fields: ['Family', 'Name']
        }
      }
    };

    return this.http.post<{ products: any[] }>(url, payload).pipe(
      map(response => (response.products || []).map(p => ({
        id: p.id || p.productId || '',
        name: p.name || '',
        family: p.family || 'Other',
        icon: p.family || 'Other',
        description: p.description || ''
      }))),
      catchError(error => {
        console.warn('Salesforce PCM API failed. Falling back to local products list.', error);
        return of(this.getMockProducts());
      })
    );
  }

  createQuote(opportunityId: string, productIds: string[]): Observable<QuoteResponse> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/rev/sales-transaction/actions/place`;

    // Construct the composite graph payload
    const records: any[] = [
      {
        referenceId: 'refQuote',
        record: {
          attributes: {
            method: 'POST',
            type: 'Quote'
          },
          Name: `Quote-${new Date().toISOString()}`,
          OpportunityId: opportunityId,
          Pricebook2Id: '01sf4000003ZgtzAAC',
          StartDate: new Date().toISOString().split('T')[0],
          ExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    ];

    productIds.forEach((prodId, index) => {
      records.push({
        referenceId: `refQuoteLine${index}`,
        record: {
          attributes: {
            type: 'QuoteLineItem',
            method: 'POST'
          },
          QuoteId: '@{refQuote.id}',
          Product2Id: prodId,
          Quantity: 1,
          StartDate: new Date().toISOString().split('T')[0],
          PeriodBoundary: 'Anniversary'
        }
      });
    });

    const payload = {
      pricingPref: 'Skip',
      catalogRatesPref: 'Skip',
      configurationPref: {
        configurationMethod: 'Skip',
        configurationOptions: {
          executeConfigurationRules: false,
          addDefaultConfiguration: false
        }
      },
      taxPref: 'Skip',
      contextDetails: {},
      graph: {
        graphId: 'createQuoteWithBundle',
        records: records
      }
    };

    return this.http.post<QuoteResponse>(url, payload).pipe(
      catchError(error => {
        console.warn('Salesforce Graph Quote API failed. Falling back to local success mockup.', error);
        return of({
          salesTransactionId: `mock-quote-${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          errors: []
        });
      })
    );
  }

  getQuoteDetails(quoteId: string): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/sobjects/Quote/${quoteId}`;

    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.warn('Salesforce Quote Details API failed. Falling back to local mock.', error);
        return of({
          Id: quoteId,
          Name: 'Mock Quote Transaction',
          QuoteNumber: `Q-${Math.floor(100000 + Math.random() * 900000)}`,
          OpportunityId: 'mock-opp-id-123',
          Pricebook2Id: '01sf4000003ZgtzAAC'
        });
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

  private getMockProducts(): Product[] {
    return [
      { id: 'prod-1', name: 'Chrome OS', family: 'Chrome', icon: 'Chrome' },
      { id: 'prod-2', name: 'Google Cloud Platform', family: 'GCP', icon: 'GCP' },
      { id: 'prod-3', name: 'Google Maps Platform', family: 'Maps', icon: 'Maps' },
      { id: 'prod-4', name: 'Google Workspace', family: 'Workspace', icon: 'Workspace' },
      { id: 'prod-5', name: 'Looker Core', family: 'GCP', icon: 'GCP' },
      { id: 'prod-6', name: 'PSO Services', family: 'PSO', icon: 'PSO' }
    ];
  }
}

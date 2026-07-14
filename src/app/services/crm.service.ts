import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

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
  pricebookEntryId?: string;
  classificationId?: string;
}

export interface QuoteResponse {
  salesTransactionId: string;
  isSuccess: boolean;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private baseUrl = '';

  constructor(private http: HttpClient) { }

  private getHeaders(): { [header: string]: string } {
    // 1. Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('accessToken') || urlParams.get('access_token') || urlParams.get('token') || urlParams.get('session_id') || urlParams.get('sid');

    if (token) {
      sessionStorage.setItem('accessToken', token);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }

    // 2. Check standard storage keys
    if (!token) {
      const keys = ['accessToken', 'access_token', 'token', 'session_id', 'sid'];
      for (const key of keys) {
        token = sessionStorage.getItem(key) || localStorage.getItem(key) || '';
        if (token) break;
      }
    }

    // 3. Heuristics: scan storage keys for Salesforce-formatted tokens (starting with 00D or containing '!')
    if (!token) {
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const val = sessionStorage.getItem(key);
            if (val && (val.startsWith('00D') || val.includes('!'))) {
              token = val;
              break;
            }
          }
        }
        if (!token) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const val = localStorage.getItem(key);
              if (val && (val.startsWith('00D') || val.includes('!'))) {
                token = val;
                break;
              }
            }
          }
        }
      } catch (e) { }
    }

    // 4. Check cookies
    if (!token) {
      const cookieMatch = document.cookie.match(/(?:^|; )sid=([^;]*)/) || document.cookie.match(/(?:^|; )session_id=([^;]*)/) || document.cookie.match(/(?:^| )access_token=([^;]*)/);
      if (cookieMatch) {
        token = decodeURIComponent(cookieMatch[1]);
      }
    }
    if (!token) {
      // Fallback to the development token if none is found
      token = '00DDz000001qvYA!ARQAQCOMsSyXqhZqnwgEgzjwAEwd6zY0sR54H0jwZVCOyPODwV.phlmwSx6QnIfoLdr6eiBtGaXPzw1V4VKpvZg4ZTliMa.6';
    }

    const headers: { [header: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  getOpportunities(): Observable<Opportunity[]> {
    const query = `SELECT Id,Name,StageName,Amount,CloseDate,Owner.Name,AccountId,Account.Name,Account.Website,CreatedDate,(SELECT Contact.Id,Contact.Name FROM OpportunityContactRoles) FROM Opportunity WHERE CreatedDate>=2026-01-28T00:00:00Z ORDER BY CreatedDate DESC LIMIT 5`;
    const url = `${this.baseUrl}/services/data/v65.0/query?q=${encodeURIComponent(query)}`;
    console.log('[API Request] [GET] getOpportunities URL:', url);

    return this.http.get<{ records: any[] }>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('[API Response] [GET] getOpportunities Success:', response);
        return this.mapSalesforceRecords(response.records || []);
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getOpportunities Failed, falling back to local mock data.', error);
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
    console.log('[API Request] [POST] getProducts URL:', url, 'Payload:', JSON.stringify(payload));

    return this.http.post<{ products: any[] }>(url, payload, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('[API Response] [POST] getProducts Success:', response);
        return (response.products || []).map(p => {
          const familyVal = p.family || p.additionalFields?.Family || p.categories?.[0]?.name || p.fields?.Product2?.Family || p.fields?.Family || 'Other';
          let pbeId = p.pricebookEntryId || p.PricebookEntryId || p.defaultPricebookEntryId || '';
          if (!pbeId && p.prices) {
            if (Array.isArray(p.prices) && p.prices.length > 0) {
              pbeId = p.prices[0].pricebookEntryId || p.prices[0].PricebookEntryId || '';
            } else {
              pbeId = p.prices.pricebookEntryId || p.prices.PricebookEntryId || '';
            }
          }
          if (!pbeId && p.additionalFields) {
            pbeId = p.additionalFields.PricebookEntryId || p.additionalFields.pricebookEntryId || '';
          }

          return {
            id: p.id || p.productId || p.Product2Id || '',
            name: p.name || p.additionalFields?.Name || '',
            family: familyVal,
            icon: familyVal,
            description: p.description || '',
            pricebookEntryId: pbeId,
            classificationId: p.productClassification?.id
          };
        });
      }),
      catchError(error => {
        console.warn('[API Error] [POST] getProducts Failed, falling back to local products list.', error);
        return of(this.getMockProducts());
      })
    );
  }

  facetedProductSearch(classificationId?: string, query?: string): Observable<Product[]> {
    const hasQuery = query && query.trim().length >= 2;

    if (hasQuery) {
      const url = `${this.baseUrl}/services/data/v66.0/connect/cpq/products/search`;

      const payload: any = {
        filter: {
          criteria: [
            { property: 'isActive', operator: 'eq', value: true },
            { property: 'Type', operator: 'eq', value: 'bundle' }
          ]
        },
        additionalFields: {
          Product2: {
            fields: ['RCA_Sort_order__c', 'RCA_Product_Count__c']
          }
        },
        limit: 100,
        categoryId: '0ZGDz000000CdNPOA0',
        searchTerm: query!.trim()
      };

      if (classificationId) {
        payload.productClassificationId = classificationId;
      }

      console.log('[API Request] [POST] facetedProductSearch (CPQ Search) URL:', url, 'Payload:', JSON.stringify(payload));

      return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
        map(response => {
          console.log('[API Response] [POST] facetedProductSearch (CPQ Search) Success:', response);
          const results = response.result || [];
          
          return results.map((p: any) => {
            const familyVal = p.family || p.additionalFields?.Family || p.categories?.[0]?.name || p.fields?.Product2?.Family || p.fields?.Family || 'Other';
            return {
              id: p.id || p.productId || '',
              name: p.name || '',
              family: familyVal,
              icon: familyVal,
              description: p.description || '',
              classificationId: p.productClassification?.id
            };
          });
        }),
        catchError(error => {
          console.warn('[API Error] [POST] facetedProductSearch (CPQ Search) Failed:', error);
          let mockProducts = this.getMockProductsByClassification(classificationId);
          const q = query!.toLowerCase().trim();
          mockProducts = mockProducts.filter(p => p.name.toLowerCase().includes(q) || p.family.toLowerCase().includes(q));
          return of(mockProducts);
        })
      );
    } else {
      const params: string[] = ['include=/products'];
      if (classificationId) {
        params.push(`productClassificationId=${encodeURIComponent(classificationId)}`);
      }
      const url = `${this.baseUrl}/services/data/v66.0/connect/pcm/products?${params.join('&')}`;

      const payload: any = {
        language: 'en_US',
        filter: {
          criteria: [
            { property: 'isActive', operator: 'eq', value: true }
          ]
        },
        offset: 0,
        pageSize: 100
      };

      console.log('[API Request] [POST] facetedProductSearch (PCM Products) URL:', url, 'Payload:', JSON.stringify(payload));

      return this.http.post<{ products: any[] }>(url, payload, { headers: this.getHeaders() }).pipe(
        map(response => {
          console.log('[API Response] [POST] facetedProductSearch (PCM Products) Success:', response);
          return (response.products || []).map(p => {
            const familyVal = p.family || p.additionalFields?.Family || p.categories?.[0]?.name || p.fields?.Product2?.Family || p.fields?.Family || 'Other';
            return {
              id: p.id || p.productId || '',
              name: p.name || p.additionalFields?.Name || '',
              family: familyVal,
              icon: familyVal,
              description: p.description || '',
              classificationId: p.productClassification?.id
            };
          });
        }),
        catchError(error => {
          console.warn('[API Error] [POST] facetedProductSearch (PCM Products) Failed:', error);
          const mockProducts = this.getMockProductsByClassification(classificationId);
          return of(mockProducts);
        })
      );
    }
  }

  globalSearchProducts(searchTerm: string, criteria: any[] = [], pageSize: number = 100, offset: number = 0): Observable<Product[]> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/pcm/products?include=/products`;
    const finalCriteria = [{ property: 'isActive', operator: 'eq', value: true }, ...criteria];

    const payload = {
      searchTerm: searchTerm,
      pageSize: pageSize,
      offset: offset,
      filter: { criteria: finalCriteria }
    };
    console.log('[API Request] [POST] globalSearchProducts URL:', url, 'Payload:', JSON.stringify(payload));

    return this.http.post<{ products: any[] }>(url, payload, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('[API Response] [POST] globalSearchProducts Success:', response);
        return (response.products || []).map(p => {
          const familyVal = p.family || p.additionalFields?.Family || p.categories?.[0]?.name || p.fields?.Product2?.Family || p.fields?.Family || 'Other';
          return {
            id: p.id || p.productId || '',
            name: p.name || p.additionalFields?.Name || '',
            family: familyVal,
            icon: familyVal,
            description: p.description || ''
          };
        });
      }),
      catchError(error => {
        console.warn('[API Error] [POST] globalSearchProducts Failed:', error);
        return of([]);
      })
    );
  }

  createQuote(opportunityId: string, products: Product[]): Observable<QuoteResponse> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/rev/sales-transaction/actions/place`;
    console.log('[API Request] createQuote - Products to add:', products);

    // Fetch PricebookEntryId for all products first
    const pbeRequests = products.map(prod => {
      const query = `SELECT Id FROM PricebookEntry WHERE Product2Id='${prod.id}' AND IsActive=true LIMIT 1`;
      const queryUrl = `${this.baseUrl}/services/data/v65.0/query/?q=${encodeURIComponent(query)}`;
      console.log('[API Request] [GET] getPricebookEntry URL:', queryUrl);
      return this.http.get<any>(queryUrl, { headers: this.getHeaders() }).pipe(
        map(res => {
          console.log('[API Response] [GET] getPricebookEntry Success:', res);
          if (res && res.records && res.records.length > 0) {
            return { ...prod, fetchedPricebookEntryId: res.records[0].Id };
          }
          return prod;
        }),
        catchError((err) => {
          console.warn('[API Error] [GET] getPricebookEntry Failed:', err);
          return of(prod);
        })
      );
    });

    return forkJoin(pbeRequests).pipe(
      switchMap(updatedProducts => {
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

        updatedProducts.forEach((prod: any, index: number) => {
          const qli: any = {
            attributes: {
              type: 'QuoteLineItem',
              method: 'POST'
            },
            QuoteId: '@{refQuote.id}',
            Product2Id: prod.id,
            Quantity: 1,
            StartDate: new Date().toISOString().split('T')[0],
            EndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            PeriodBoundary: 'Anniversary'
          };

          const pbeId = prod.fetchedPricebookEntryId || prod.pricebookEntryId;
          if (pbeId) {
            qli.PricebookEntryId = pbeId;
          }

          records.push({
            referenceId: `refQuoteLine${index}`,
            record: qli
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

        console.log('[API Request] [POST] createQuote URL:', url, 'Payload:', JSON.stringify(payload));

        return this.http.post<QuoteResponse>(url, payload, { headers: this.getHeaders() }).pipe(
          map(res => {
            console.log('[API Response] [POST] createQuote Success:', res);
            return res;
          }),
          catchError(error => {
            console.warn('[API Error] [POST] createQuote Failed, falling back to local mock.', error);
            return of({
              salesTransactionId: `mock-quote-${Math.random().toString(36).substr(2, 9)}`,
              isSuccess: true,
              errors: []
            });
          })
        );
      })
    );
  }

  getQuoteDetails(quoteId: string): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/sobjects/Quote/${quoteId}`;
    console.log('[API Request] [GET] getQuoteDetails URL:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [GET] getQuoteDetails Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getQuoteDetails Failed, falling back to local mock.', error);
        return of({
          Id: quoteId,
          Name: 'Mock Quote Transaction',
          QuoteNumber: `Q-${Math.floor(100000 + Math.random() * 900000)}`,
          OpportunityId: 'mock-opp-id-123',
          Pricebook2Id: '01sf4000003ZgtzAAC',
          opportunityName: 'Opportunity Name 1',
          primaryContact: 'Sarah Connor',
          salesChannel: 'Direct',
          configuredProducts: ['Google Cloud Platform'],
          billingFrequency: 'Annual in Advance Anniversary',
          termStartsOn: 'Fixed Start Date',
          termStartDate: '2026-02-01',
          termEndDate: '2029-01-31',
          termMonths: 36,
          paymentAccount: {
            name: 'XXX XXXXXX',
            billingAccount: 'XXXXXX-XXXXXX-XXXXXXX',
            paymentAccountId: 'XXXXXX-XXXXXX-XXXXXXX',
            billingAddress: '5920 Niagara River Parkway, Niagara Falls ON L2E 6X8 CA',
            billingCurrency: 'CAD'
          }
        });
      })
    );
  }

  getQuotePreview(quoteId: string): Observable<any> {
    const q = `SELECT Id,Name,QuoteNumber,Status,GrandTotal,StartDate,ExpirationDate,Pricebook2Id,Opportunity.Name,Opportunity.Sales_Channel__c,Opportunity.Primary_Contact__c,Opportunity.Primary_Contact__r.Name,Account.Name,Account.Website,(SELECT Id,Product2.Name,Quantity,UnitPrice,TotalPrice,ListPrice,StartDate,EndDate,Discount,Incentive__c,NetUnitPrice FROM QuoteLineItems) FROM Quote WHERE Id='${quoteId}'`;
    const url = `${this.baseUrl}/services/data/v66.0/query/?q=${encodeURIComponent(q)}`;
    console.log('[API Request] [GET] getQuotePreview URL:', url);
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [GET] getQuotePreview Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getQuotePreview Failed, falling back to mock.', error);
        return of({
          records: [{
            Id: quoteId,
            Name: 'DealManagement-Mock-Preview',
            QuoteNumber: '00003393',
            Status: 'Draft',
            GrandTotal: 49881.0661,
            StartDate: '2026-03-18',
            ExpirationDate: '2026-05-02',
            Pricebook2Id: '01sf4000003ZgtzAAC',
            Opportunity: {
              Name: 'RVM Opportunity',
              Sales_Channel__c: 'Direct',
              Primary_Contact__r: { Name: 'Rafael Pereira' }
            },
            Account: {
              Name: 'RioVerde Manufacturing S.A.',
              Website: 'https://rioverdemanufacturingsa.example.com'
            },
            QuoteLineItems: {
              totalSize: 3,
              done: true,
              records: [
                {
                  Id: 'mock-line-1',
                  Product2: { Name: 'Google Cloud Platform RCA', Type: 'Bundle' },
                  Quantity: 1,
                  UnitPrice: 0,
                  TotalPrice: 0,
                  ListPrice: 0,
                  StartDate: '2026-03-18',
                  EndDate: '2026-05-02',
                  Discount: null,
                  Incentive__c: null
                },
                {
                  Id: 'mock-line-2',
                  Product2: { Name: 'Document AI' },
                  Quantity: 1,
                  UnitPrice: 0,
                  TotalPrice: 0,
                  ListPrice: 0,
                  StartDate: '2026-03-18',
                  EndDate: '2026-03-20',
                  Discount: 22,
                  Incentive__c: null
                },
                {
                  Id: 'mock-line-3',
                  Product2: { Name: 'API Management' },
                  Quantity: 1,
                  UnitPrice: 0,
                  TotalPrice: 0,
                  ListPrice: 0,
                  StartDate: '2026-03-18',
                  EndDate: '2026-03-20',
                  Discount: 22,
                  Incentive__c: null
                }
              ]
            }
          }]
        });
      })
    );
  }

  createCommitmentDetails(records: any[]): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/composite/tree/Commitment_Details__c`;
    console.log('[API Request] [POST] createCommitmentDetails URL:', url, 'Payload:', JSON.stringify(records, null, 2));
    return this.http.post<any>(url, { records }, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [POST] createCommitmentDetails Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [POST] createCommitmentDetails Failed, falling back to success mock.', error);
        return of({
          hasErrors: false,
          results: records.map((r, idx) => ({
            referenceId: r.attributes.referenceId,
            id: `mock-commit-detail-${idx + 1}`
          }))
        });
      })
    );
  }

  getBundleQuoteLineItems(quoteId: string): Observable<any> {
    const query = `SELECT Id,PricebookEntryId,Product2Id,Product2.Name,Product2.Type FROM QuoteLineItem WHERE QuoteId='${quoteId}' AND Product2.Type='Bundle'`;
    const url = `${this.baseUrl}/services/data/v60.0/query/?q=${encodeURIComponent(query)}`;
    console.log('[API Request] [GET] getBundleQuoteLineItems URL:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [GET] getBundleQuoteLineItems Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getBundleQuoteLineItems Failed, falling back to local mock.', error);
        return of({
          totalSize: 1,
          done: true,
          records: [
            {
              attributes: { type: 'QuoteLineItem', url: `/services/data/v60.0/sobjects/QuoteLineItem/mock-bundle-line-id` },
              Id: 'mock-bundle-line-id',
              Product2Id: 'mock-bundle-product-id',
              Product2: {
                Name: sessionStorage.getItem('mockConfiguredProduct') || 'Google Cloud Platform RCA',
                Type: 'Bundle'
              },
              PricebookEntryId: 'mock-pbe-id'
            }
          ]
        });
      })
    );
  }

  getProductDetails(productId: string): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/cpq/products/${productId}`;
    console.log('[API Request] [POST] getProductDetails URL:', url);
    return this.http.post<any>(url, {}, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [POST] getProductDetails Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [POST] getProductDetails Failed, falling back to local mock.', error);
        return of({
          apiStatus: {
            messages: [],
            statusCode: 'FetchedDetailsSuccessfully'
          },
          result: {
            id: productId,
            name: 'Looker New RCA',
            productComponentGroups: [
              {
                id: 'y1',
                name: 'Platform',
                components: [
                  {
                    id: 'mock-platform-std',
                    name: 'Looker (Google Cloud core) Standard Platform Annual Subscription RCA',
                    prices: [
                      { price: 5000.0, pricebookEntryId: 'mock-platform-std-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 500.0, pricebookEntryId: 'mock-platform-std-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  },
                  {
                    id: 'mock-platform-ent',
                    name: 'Looker (Google Cloud core) Enterprise Platform Annual Subscription RCA',
                    prices: [
                      { price: 10000.0, pricebookEntryId: 'mock-platform-ent-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 1000.0, pricebookEntryId: 'mock-platform-ent-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  }
                ]
              },
              {
                id: 'y2',
                name: 'Users',
                components: [
                  {
                    id: 'mock-user-std',
                    name: 'Looker (Google Cloud core) Standard User Annual Subscription RCA',
                    prices: [
                      { price: 30.0, pricebookEntryId: 'mock-user-std-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 3.0, pricebookEntryId: 'mock-user-std-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  },
                  {
                    id: 'mock-user-dev',
                    name: 'Looker (Google Cloud core) Developer User Annual Subscription RCA',
                    prices: [
                      { price: 60.0, pricebookEntryId: 'mock-user-dev-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 6.0, pricebookEntryId: 'mock-user-dev-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  },
                  {
                    id: 'mock-user-view',
                    name: 'Looker (Google Cloud core) Viewer User Annual Subscription RCA',
                    prices: [
                      { price: 30.0, pricebookEntryId: 'mock-user-view-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 3.0, pricebookEntryId: 'mock-user-view-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  }
                ]
              },
              {
                id: 'y3',
                name: 'Platform', // matches Platform or Nonprod in real API but we search components
                components: [
                  {
                    id: 'mock-nonprod-std',
                    name: 'Looker Core Nonprod Standard RCA',
                    prices: [
                      { price: 250.0, pricebookEntryId: 'mock-nonprod-std-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 25.0, pricebookEntryId: 'mock-nonprod-std-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  },
                  {
                    id: 'mock-nonprod-ent',
                    name: 'Looker Core Nonprod Enterprise RCA',
                    prices: [
                      { price: 416.67, pricebookEntryId: 'mock-nonprod-ent-pbe-ann', pricingModel: { frequency: 'Annual' } },
                      { price: 41.67, pricebookEntryId: 'mock-nonprod-ent-pbe-mon', pricingModel: { frequency: 'Months' } }
                    ]
                  }
                ]
              }
            ]
          }
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

  getPicklists(): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/ui-api/object-info/QuoteLineItem/picklist-values/012000000000000AAA`;
    console.log('[API Request] [GET] getPicklists URL:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('[API Response] [GET] getPicklists Success:', response);
        const picklistFieldValues = response.picklistFieldValues || {};

        const extractValues = (fieldName: string) => {
          const field = picklistFieldValues[fieldName];
          return field?.values ? field.values.map((v: any) => v.value) : null;
        };

        return {
          billingFrequencies: extractValues('Billing_Frequency__c'),
          termStartsOnOptions: extractValues('Term_Starts_On__c'),
          operationTypes: extractValues('Operation_Type__c'),
          regions: extractValues('Looker_Region__c')
        };
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getPicklists Failed, falling back to local mock.', error);
        return of({
          billingFrequencies: [
            'Quarterly in Advance Anniversary',
            'Annual in Advance Anniversary',
            'Monthly in Arrears',
            'Quarterly in Advance',
            'Annual in Advance'
          ],
          termStartsOnOptions: ['Fixed Start Date', 'Upon Provisioning', 'Customer Signature Date'],
          operationTypes: ['New', 'Upsell', 'Renewal'],
          regions: [
            'Dallas (us-south-1)',
            'Oregon (us-west-2)',
            'Iowa (us-central1)',
            'Belgium (europe-west1)'
          ]
        });
      })
    );
  }

  submitQuoteDetails(payload: any): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/connect/rev/sales-transaction/actions/place`;
    console.log('[API Request] [POST] submitQuoteDetails URL:', url, 'Payload:', JSON.stringify(payload));
    return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [POST] submitQuoteDetails Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [POST] submitQuoteDetails Failed:', error);
        return of({ success: true, mocked: true });
      })
    );
  }

  updateQuoteLineDiscounts(payload: any): Observable<any> {
    const url = `${this.baseUrl}/services/data/v65.0/composite/sobjects`;
    console.log('[API Request] [PATCH] updateQuoteLineDiscounts URL:', url, 'Payload:', JSON.stringify(payload));
    return this.http.patch<any>(url, payload, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [PATCH] updateQuoteLineDiscounts Success:', res);
        return res;
      }),
      catchError(error => {
        console.warn('[API Error] [PATCH] updateQuoteLineDiscounts Failed:', error);
        return of({ success: true, mocked: true });
      })
    );
  }

  // Format date helper to make sure date is YYYY-MM-DD for Salesforce
  private formatDateForSalesforce(dateStr: string): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  // Executes a bulk PATCH/POST to update or create Quote Line Items with discounts/incentives using the Place API
  applyBulkDiscounts(
    value: number,
    valueType: 'Discount' | 'Incentive',
    products: any[],
    startDate: string,
    endDate: string
  ): Observable<any> {
    const quoteId = sessionStorage.getItem('selectedQuoteId') || 'unknown';
    const url = `${this.baseUrl}/services/data/v65.0/connect/rev/sales-transaction/actions/place`;

    // 1. Fetch current QuoteLineItems on this Quote to decide PATCH vs POST
    const query = `SELECT Id, Product2Id, Product2.Name FROM QuoteLineItem WHERE QuoteId = '${quoteId}'`;
    const queryUrl = `${this.baseUrl}/services/data/v65.0/query?q=${encodeURIComponent(query)}`;
    console.log('[applyBulkDiscounts] [GET] Fetching existing QuoteLineItems:', queryUrl);

    return this.http.get<{ records: any[] }>(queryUrl, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('[applyBulkDiscounts] Failed to query existing QuoteLineItems, assuming none exist:', err);
        return of({ records: [] });
      }),
      switchMap(queryRes => {
        const existingLines = queryRes.records || [];
        
        // Map products we need to process
        const processRequests = products.map((prod, idx) => {
          // Look for an existing QuoteLineItem matching either ID or Name
          const matchedLine = existingLines.find(line => 
            line.Product2Id === prod.id || 
            (line.Product2 && line.Product2.Name === prod.name)
          );

          if (matchedLine) {
            // Already exists -> PATCH
            const graphRec: any = {
              referenceId: `refQuoteLine_patch_${idx + 1}`,
              record: {
                attributes: {
                  type: 'QuoteLineItem',
                  method: 'PATCH',
                  id: matchedLine.Id
                }
              }
            };
            if (valueType === 'Discount') {
              graphRec.record.Discount = value;
            } else {
              graphRec.record.Incentive__c = value;
            }
            return of(graphRec);
          } else {
            // Doesn't exist -> Query PricebookEntry matching Product Name to perform POST
            const pbeQuery = `SELECT Id, Product2Id FROM PricebookEntry WHERE Product2.Name = '${prod.name}' AND Product2.Type = 'Bundle' AND IsActive = true LIMIT 1`;
            const pbeUrl = `${this.baseUrl}/services/data/v65.0/query?q=${encodeURIComponent(pbeQuery)}`;
            console.log(`[applyBulkDiscounts] Querying PricebookEntry for name "${prod.name}":`, pbeUrl);

            return this.http.get<{ records: any[] }>(pbeUrl, { headers: this.getHeaders() }).pipe(
              map(pbeRes => {
                const records = pbeRes.records || [];
                if (records.length > 0) {
                  const pbe = records[0];
                  const graphRec: any = {
                    referenceId: `refQuoteLine_post_${idx + 1}`,
                    record: {
                      attributes: {
                        type: 'QuoteLineItem',
                        method: 'POST'
                      },
                      QuoteId: quoteId,
                      Product2Id: pbe.Product2Id,
                      PricebookEntryId: pbe.Id,
                      StartDate: this.formatDateForSalesforce(startDate) || new Date().toISOString().split('T')[0],
                      EndDate: this.formatDateForSalesforce(endDate) || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                      PeriodBoundary: 'Anniversary',
                      Quantity: 1,
                      SortOrder: 400 + idx
                    }
                  };
                  if (valueType === 'Discount') {
                    graphRec.record.Discount = value;
                  } else {
                    graphRec.record.Incentive__c = value;
                  }
                  return graphRec;
                } else {
                  console.warn(`[applyBulkDiscounts] No active PricebookEntry found for Bundle product matching name "${prod.name}"`);
                  return null;
                }
              }),
              catchError(err => {
                console.warn(`[applyBulkDiscounts] PricebookEntry lookup failed for "${prod.name}":`, err);
                return of(null);
              })
            );
          }
        });

        if (processRequests.length === 0) {
          return of({ isSuccess: true, mock: true, message: 'No products to apply.' });
        }

        return forkJoin(processRequests).pipe(
          switchMap(graphRecordsRaw => {
            const graphRecords = graphRecordsRaw.filter(r => r !== null);
            if (graphRecords.length === 0) {
              console.warn('[applyBulkDiscounts] No valid records to update or create.');
              return of({ isSuccess: true, mock: true, message: 'No records were matched/created.' });
            }

            // Prepend the Quote PATCH header
            graphRecords.unshift({
              referenceId: 'refQuote',
              record: {
                attributes: {
                  method: 'PATCH',
                  type: 'Quote',
                  id: quoteId
                }
              }
            });

            const payload = {
              pricingPref: 'System',
              catalogRatesPref: 'Skip',
              configurationPref: {
                configurationMethod: 'Skip',
                configurationOptions: {
                  validateProductCatalog: true,
                  validateAmendRenewCancel: true,
                  executeConfigurationRules: true,
                  addDefaultConfiguration: true
                }
              },
              taxPref: 'Skip',
              contextDetails: {},
              graph: {
                graphId: 'createQuoteWithLines',
                records: graphRecords
              }
            };

            console.log('[API Request] [POST] applyBulkDiscounts (Composite Graph Place API) URL:', url, 'Payload:', JSON.stringify(payload));

            return this.http.post<any>(url, payload, { headers: this.getHeaders() }).pipe(
              map(res => {
                console.log('[API Response] [POST] applyBulkDiscounts Success:', res);
                if (res && res.isSuccess === false) {
                  const errMsg = res.errorResponse?.[0]?.message || 'Salesforce failed to apply discounts.';
                  throw new Error(errMsg);
                }
                return res;
              }),
              catchError(error => {
                console.error('[API Error] [POST] applyBulkDiscounts Failed:', error);
                throw error;
              })
            );
          })
        );
      })
    );
  }

  /**
   * Fetches all QuoteLineItems for a given Quote and returns a lookup map:
   * { [Product2Id]: QuoteLineItemId }
   * 
   * This is required because the select-products modal stores Product2 IDs (01t...),
   * but the composite/sobjects PATCH API requires the QuoteLineItem ID (0QL...).
   */
  getQuoteLineItemsByQuoteId(quoteId: string): Observable<{ [product2Id: string]: string }> {
    const query = `SELECT Id, Product2Id FROM QuoteLineItem WHERE QuoteId = '${quoteId}'`;
    const url = `${this.baseUrl}/services/data/v65.0/query?q=${encodeURIComponent(query)}`;
    console.log('[API Request] [GET] getQuoteLineItemsByQuoteId URL:', url);

    return this.http.get<{ records: any[] }>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('[API Response] [GET] getQuoteLineItemsByQuoteId Success:', response);
        const map: { [product2Id: string]: string } = {};
        (response.records || []).forEach((rec: any) => {
          if (rec.Product2Id && rec.Id) {
            map[rec.Product2Id] = rec.Id;
            map[rec.Product2Id.substring(0, 15)] = rec.Id;
          }
        });
        console.log('[getQuoteLineItemsByQuoteId] Product2Id → QuoteLineItemId map:', map);
        return map;
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getQuoteLineItemsByQuoteId Failed:', error);
        return of({});
      })
    );
  }

  // Fetches product classifications (groups) for a given bundle product
  getProductClassifications(bundleProductId: string): Observable<any[]> {
    const query = `SELECT Id, Name, Code, No_Of_Child_Products__c, Status FROM ProductClassification WHERE Parent_Bundle_Product_ID__c = '${bundleProductId}'`;
    const url = `${this.baseUrl}/services/data/v66.0/query?q=${encodeURIComponent(query)}`;
    console.log('[API Request] [GET] getProductClassifications URL:', url);

    return this.http.get<{ records: any[] }>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('[API Response] [GET] getProductClassifications Success:', res);
        return res.records || [];
      }),
      catchError(error => {
        console.warn('[API Error] [GET] getProductClassifications Failed:', error);
        return of(this.getMockProductClassifications());
      })
    );
  }

  getMockProductClassifications(): any[] {
    return [
      { Id: "11BDz00000000N7MAI", Name: "Compute", Code: "COMPUTE", No_Of_Child_Products__c: 269, Status: "Active" },
      { Id: "11BDz00000000N8MAI", Name: "Kubernetes", Code: "KUBERNETES", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000N9MAI", Name: "Serverless", Code: "SERVERLESS", No_Of_Child_Products__c: 107, Status: "Active" },
      { Id: "11BDz00000000NAMAY", Name: "App Engine", Code: "APP ENGINE", No_Of_Child_Products__c: 84, Status: "Active" },
      { Id: "11BDz00000000NBMAY", Name: "Storage", Code: "STORAGE", No_Of_Child_Products__c: 60, Status: "Active" },
      { Id: "11BDz00000000NCMAY", Name: "Cloud SQL", Code: "CLOUD SQL", No_Of_Child_Products__c: 406, Status: "Active" },
      { Id: "11BDz00000000NDMAY", Name: "Spanner", Code: "SPANNER", No_Of_Child_Products__c: 118, Status: "Active" },
      { Id: "11BDz00000000NEMAY", Name: "BigQuery", Code: "BIGQUERY", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NFMAY", Name: "Dataflow", Code: "DATAFLOW", No_Of_Child_Products__c: 173, Status: "Active" },
      { Id: "11BDz00000000NGMAY", Name: "Dataproc", Code: "DATAPROC", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NHMAY", Name: "Pub Sub", Code: "PUB SUB", No_Of_Child_Products__c: 83, Status: "Active" },
      { Id: "11BDz00000000NIMAY", Name: "Networking", Code: "NETWORKING", No_Of_Child_Products__c: 210, Status: "Active" },
      { Id: "11BDz00000000NJMAY", Name: "Load Balancing", Code: "LOAD BALANCING", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NKMAY", Name: "Cloud CDN", Code: "CLOUD CDN", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NLMAY", Name: "Cloud DNS", Code: "CLOUD DNS", No_Of_Child_Products__c: 274, Status: "Active" },
      { Id: "11BDz00000000NMMAY", Name: "Security", Code: "SECURITY", No_Of_Child_Products__c: 228, Status: "Active" },
      { Id: "11BDz00000000NNMAY", Name: "IAM", Code: "IAM", No_Of_Child_Products__c: 84, Status: "Active" },
      { Id: "11BDz00000000NOMAY", Name: "KMS", Code: "KMS", No_Of_Child_Products__c: 247, Status: "Active" },
      { Id: "11BDz00000000NPMAY", Name: "Secret Manager", Code: "SECRET MANAGER", No_Of_Child_Products__c: 345, Status: "Active" },
      { Id: "11BDz00000000NQMAY", Name: "Cloud Armor", Code: "CLOUD ARMOR", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NRMAY", Name: "Monitoring", Code: "MONITORING", No_Of_Child_Products__c: 344, Status: "Active" },
      { Id: "11BDz00000000NSMAY", Name: "Logging", Code: "LOGGING", No_Of_Child_Products__c: 296, Status: "Active" },
      { Id: "11BDz00000000NTMAY", Name: "Trace", Code: "TRACE", No_Of_Child_Products__c: 137, Status: "Active" },
      { Id: "11BDz00000000NUMAY", Name: "Error Reporting", Code: "ERROR REPORTING", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NVMAY", Name: "Analytics", Code: "ANALYTICS", No_Of_Child_Products__c: 411, Status: "Active" },
      { Id: "11BDz00000000NWMAY", Name: "Looker", Code: "LOOKER", No_Of_Child_Products__c: 135, Status: "Active" },
      { Id: "11BDz00000000NXMAY", Name: "Vertex AI", Code: "VERTEX AI", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NYMAY", Name: "Vision AI", Code: "VISION AI", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NZMAY", Name: "Speech AI", Code: "SPEECH AI", No_Of_Child_Products__c: 75, Status: "Active" },
      { Id: "11BDz00000000NaMAI", Name: "Translation", Code: "TRANSLATION", No_Of_Child_Products__c: 406, Status: "Active" },
      { Id: "11BDz00000000NbMAI", Name: "Document AI", Code: "DOCUMENT AI", No_Of_Child_Products__c: 406, Status: "Active" },
      { Id: "11BDz00000000NcMAI", Name: "Retail Search", Code: "RETAIL SEARCH", No_Of_Child_Products__c: 406, Status: "Active" },
      { Id: "11BDz00000000NdMAI", Name: "Recommendations", Code: "RECOMMENDATIONS", No_Of_Child_Products__c: 392, Status: "Active" },
      { Id: "11BDz00000000NeMAI", Name: "API Management", Code: "API MANAGEMENT", No_Of_Child_Products__c: 392, Status: "Active" },
      { Id: "11BDz00000000NfMAI", Name: "Apigee", Code: "APIGEE", No_Of_Child_Products__c: 392, Status: "Active" },
      { Id: "11BDz00000000NgMAI", Name: "Integration", Code: "INTEGRATION", No_Of_Child_Products__c: 222, Status: "Active" },
      { Id: "11BDz00000000NhMAI", Name: "Eventarc", Code: "EVENTARC", No_Of_Child_Products__c: 354, Status: "Active" },
      { Id: "11BDz00000000NiMAI", Name: "Cloud Run", Code: "CLOUD RUN", No_Of_Child_Products__c: 260, Status: "Active" },
      { Id: "11BDz00000000NjMAI", Name: "Cloud Build", Code: "CLOUD BUILD", No_Of_Child_Products__c: 368, Status: "Active" },
      { Id: "11BDz00000000NkMAI", Name: "Artifact Registry", Code: "ARTIFACT REGISTRY", No_Of_Child_Products__c: 242, Status: "Active" },
      { Id: "11BDz00000000NlMAI", Name: "DevOps", Code: "DEVOPS", No_Of_Child_Products__c: 299, Status: "Active" },
      { Id: "11BDz00000000NmMAI", Name: "Identity Platform", Code: "IDENTITY PLATFORM", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NnMAI", Name: "Firebase", Code: "FIREBASE", No_Of_Child_Products__c: 87, Status: "Active" },
      { Id: "11BDz00000000NoMAI", Name: "Digital", Code: "DIGITAL", No_Of_Child_Products__c: 114, Status: "Active" },
      { Id: "11BDz00000000NpMAI", Name: "Commerce", Code: "COMMERCE", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NqMAI", Name: "Media", Code: "MEDIA", No_Of_Child_Products__c: 89, Status: "Active" },
      { Id: "11BDz00000000NrMAI", Name: "Gaming", Code: "GAMING", No_Of_Child_Products__c: 80, Status: "Active" },
      { Id: "11BDz00000000NsMAI", Name: "IoT", Code: "IOT", No_Of_Child_Products__c: 109, Status: "Active" },
      { Id: "11BDz00000000NtMAI", Name: "Edge", Code: "EDGE", No_Of_Child_Products__c: 268, Status: "Active" },
      { Id: "11BDz00000000NuMAI", Name: "Maps", Code: "MAPS", No_Of_Child_Products__c: 148, Status: "Active" },
      { Id: "11BDz00000000NvMAI", Name: "ROOT - Enterprise Services", Code: "ROOT_ENTERPRISE_SERVICES", No_Of_Child_Products__c: null, Status: "Active" }
    ];
  }

  getMockProductsByClassification(classificationId?: string): Product[] {
    if (!classificationId) {
      return this.getMockProducts();
    }

    // Map classificationIds to their mock GCP products
    if (classificationId === '11BDz00000000N7MAI') { // Compute
      return [
        { id: '01tDz00000EahIw', name: 'Compute Engine N2 Custom VCPU', family: 'Compute', icon: 'Compute' },
        { id: '01tDz00000EahIx', name: 'Compute Engine N2 Custom RAM', family: 'Compute', icon: 'Compute' },
        { id: '01tDz00000EahIn', name: 'Compute Engine Sole Tenant Node', family: 'Compute', icon: 'Compute' }
      ];
    } else if (classificationId === '11BDz00000000N8MAI') { // Kubernetes
      return [
        { id: '01tDz00000EahK1', name: 'Google Kubernetes Engine (GKE) Autopilot pod', family: 'Kubernetes', icon: 'Kubernetes' },
        { id: '01tDz00000EahK2', name: 'GKE Standard Node management', family: 'Kubernetes', icon: 'Kubernetes' }
      ];
    } else if (classificationId === '11BDz00000000NBMAY') { // Storage
      return [
        { id: '01tDz00000EahS1', name: 'Cloud Storage Standard Class', family: 'Storage', icon: 'Storage' },
        { id: '01tDz00000EahS2', name: 'Cloud Storage Archive Class', family: 'Storage', icon: 'Storage' }
      ];
    } else if (classificationId === '11BDz00000000NEMAY') { // BigQuery
      return [
        { id: '01tDz00000EahB1', name: 'BigQuery Compute Slot', family: 'BigQuery', icon: 'BigQuery' },
        { id: '01tDz00000EahB2', name: 'BigQuery Active Storage', family: 'BigQuery', icon: 'BigQuery' }
      ];
    }

    // Default mock products for other categories
    return [
      { id: '01tDz00000EahIw', name: 'Compute Engine N2 Custom VCPU', family: 'Compute', icon: 'Compute' },
      { id: '01tDz00000EahIx', name: 'Compute Engine N2 Custom RAM', family: 'Compute', icon: 'Compute' },
      { id: '01tDz00000EahIn', name: 'Compute Engine Sole Tenant Node', family: 'Compute', icon: 'Compute' }
    ];
  }
}

import { Injectable } from '@angular/core';

export interface ChildProduct {
  name: string;
  quantity: number;
  region: string;
  gcpProjectId: string;
  lookerInstanceId: string;
  discount: number;
  productId?: string;
  productCode?: string;
  crmProductName?: string;
  searchKey?: string;
}

export interface Period {
  name: string;
  startDate: string;
  endDate: string;
  platformProduct: string;
  discount: number;
  childProducts: ChildProduct[];
  expanded?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { message: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class PeriodService {

  getDefaultChildProducts(): ChildProduct[] {
    return [
      { name: 'Standard User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Developer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Viewer User', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 },
      { name: 'Non-prod', quantity: 0, region: '', gcpProjectId: '', lookerInstanceId: '', discount: 0 }
    ];
  }

  generateYearlyPeriods(startDateStr: string, endDateStr: string): Period[] {
    const periods: Period[] = [];
    let currentStartDate = new Date(startDateStr);
    const finalEndDate = new Date(endDateStr);
    let periodIndex = 1;

    while (currentStartDate <= finalEndDate) {
      // Calculate end date for this period (1 year - 1 day)
      let currentEndDate = new Date(currentStartDate);
      currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);
      currentEndDate.setDate(currentEndDate.getDate() - 1);

      if (currentEndDate > finalEndDate) {
        currentEndDate = new Date(finalEndDate);
      }

      periods.push({
        name: `Period ${periodIndex}`,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: currentEndDate.toISOString().split('T')[0],
        platformProduct: '',
        discount: 0,
        childProducts: this.getDefaultChildProducts(),
        expanded: periodIndex === 1
      });

      // Next start date is end date + 1 day
      currentStartDate = new Date(currentEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
      periodIndex++;
    }

    return periods;
  }

  generateCustomPeriods(startDateStr: string, endDateStr: string, monthsPerPeriod: number): Period[] {
    const periods: Period[] = [];
    let currentStartDate = new Date(startDateStr);
    const finalEndDate = new Date(endDateStr);
    let periodIndex = 1;

    while (currentStartDate <= finalEndDate) {
      let currentEndDate = new Date(currentStartDate);
      currentEndDate.setMonth(currentEndDate.getMonth() + monthsPerPeriod);
      currentEndDate.setDate(currentEndDate.getDate() - 1);

      if (currentEndDate > finalEndDate) {
        currentEndDate = new Date(finalEndDate);
      }

      periods.push({
        name: `Period ${periodIndex}`,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: currentEndDate.toISOString().split('T')[0],
        platformProduct: '',
        discount: 0,
        childProducts: this.getDefaultChildProducts(),
        expanded: periodIndex === 1
      });

      currentStartDate = new Date(currentEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
      periodIndex++;
    }

    return periods;
  }

  validatePeriods(periods: Period[]): ValidationResult {
    const errors: { message: string }[] = [];

    if (periods.length === 0) {
       return { isValid: false, errors: [{ message: 'No periods configured.' }] };
    }

    // Validate gaps
    for (let i = 0; i < periods.length - 1; i++) {
      const currentEndDate = new Date(periods[i].endDate);
      const nextStartDate = new Date(periods[i + 1].startDate);
      
      const expectedNextStartDate = new Date(currentEndDate);
      expectedNextStartDate.setDate(expectedNextStartDate.getDate() + 1);
      
      if (nextStartDate.getTime() !== expectedNextStartDate.getTime()) {
        errors.push({ message: 'Period dates must be contiguous. Please correct the gaps.' });
        break; 
      }
    }

    // Validate child products
    for (const period of periods) {
      for (const child of period.childProducts) {
        if (child.quantity > 0) {
          if (!child.region || !child.gcpProjectId || !child.lookerInstanceId) {
            errors.push({ message: 'GCP Project ID is required when quantity is greater than 0.' });
            break; 
          }
        }
      }
      if (errors.length > 0 && errors[errors.length - 1].message.includes('GCP Project ID is required')) {
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}


import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import{ReportDataResponse, ReportMetadata} from '../../../models/report-response.models'
import{EnFilterType} from '../../../models/enums.models'
import { EnFormatType } from '../../../models/enums.models';
import { AggregationType } from '../../../models/enums.models';
import { FilterDefinition } from '../../../models/filter.models';
import { ReportDataRequest } from '../../../models/report-request.models';
import { ReportService } from '../../../core/services/report';
import { FormsModule } from '@angular/forms';
export interface FilterSelectionObject {
  id: number;
  columnName: string;
  value: any;
}
@Component({
  selector: 'app-dynamic-filter',
    standalone: true,

  imports: [CommonModule,FormsModule],
  templateUrl: './dynamic-filter.html',
  styleUrl: './dynamic-filter.css',
})

export class DynamicFilter implements OnInit   {
  
  @Input() filter!: FilterDefinition;
  @Input() queryId!: number;
  
@Output() remove = new EventEmitter<number>();
@Output() reset = new EventEmitter<number>();
@Output() valueChange  = new EventEmitter<FilterSelectionObject>();
selectedSingleValue: string = 'ALL';
isDefaultLocked = false;
isRangeLocked = false;
isDateLocked = false;
  EnFilterType = EnFilterType;
textValue: string = '';
  optionsFromApi: any[] = [];
selectedFilterObject: FilterSelectionObject | null = null;
minValue: number | null = null;
maxValue: number | null = null;

minDate: string | null = null;
maxDate: string | null = null;
isExpanded: boolean = true;
selectedMultiValues: string[] = [];
  constructor(private reportService: ReportService) {}
  
  removeFilter() {
  this.remove.emit(this.filter.id);
}

resetFilter() {
    this.selectedSingleValue = 'ALL';
this.selectedMultiValues = [];
  this.textValue = '';

  this.minValue = null;
  this.maxValue = null;

  this.minDate = null;
  this.maxDate = null;

  this.selectedFilterObject = null;
    this.isDefaultLocked = false;
  this.isRangeLocked = false;
  this.isDateLocked = false;

  this.reset.emit(this.filter.id); 
    console.log('FILTER RESET:', this.filter.columnName);
}
submitDefault() {

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: this.textValue
  };

    console.log('SUBMIT DEFAULT:', this.selectedFilterObject);

  this.isDefaultLocked = true;
  this.isExpanded = false; 
  this.valueChange.emit(this.selectedFilterObject); // ⭐ مهم
}
ngOnInit(): void {

  console.log('FILTER RECEIVED:', this.filter);
  console.log('QUERY ID:', this.queryId);

  this.loadData();
}
get filterType(): string {
  return String(this.filter.type);
}

isSingleSelect(): boolean {
  return this.filterType === '6' || this.filterType === 'SINGLE_SELECT_MENU';
}
get filterTypeNormalized(): EnFilterType {
  return this.filter.type as EnFilterType;
}
get isMultiSelect(): boolean {
  return (
    this.filterTypeNormalized === EnFilterType.MULTI_SELECT_MENU ||
    this.filterTypeNormalized === EnFilterType.CHECK_BOX
  );
}
isDefault(): boolean {
  return this.filter.type === EnFilterType.DEFAULT
    || (this.filter.type as any) === 'DEFAULT';
}

isValueRange(): boolean {
  return this.filter.type === EnFilterType.VALUE_RANGE
    || (this.filter.type as any) === 'VALUE_RANGE';
}

isDate(): boolean {
  return this.filterType === '3' || this.filterType === 'DATE';
}
onMultiSelectChange(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const value = checkbox.value;

  if (checkbox.checked) {
    this.selectedMultiValues.push(value);
  } else {
    this.selectedMultiValues = this.selectedMultiValues.filter(v => v !== value);
  }

  console.log('MULTI SELECT:', this.selectedMultiValues);
}
submitMultiSelect() {

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: this.selectedMultiValues.join(',') // مهم: فواصل
  };

  console.log('MULTI SUBMIT:', this.selectedFilterObject);

  this.isExpanded = false;
  this.valueChange.emit(this.selectedFilterObject);
}
  // loadDistinctOptions(): void {

  //   const request: ReportDataRequest = {
  //     filters: [],
  //     paginationParams: {
  //       pageNumber: 1,
  //       pageSize: 100,
  //       sortColumn: '',
  //       sortDirection: ''
  //     }
  //   };

  //   console.log('CALLING API WITH:', request);

  //   this.reportService.getData(this.queryId, request)
  //     .subscribe({
  //       next: (res: ReportDataResponse) => {

  //         console.log('API RESPONSE:', res);
  //         console.log('TYPE:', this.filter.type);

  //         const col = this.filter.columnName;

  //         this.optionsFromApi = [
  //           ...new Set(res.rawData.map((x: any) => x[col]))
  //         ];

  //         console.log('DISTINCT OPTIONS:', this.optionsFromApi);
  //       },
  //       error: (err) => {
  //         console.error('API ERROR:', err);
  //       }
  //     });
  // }

loadData(): void {

  const request: ReportDataRequest = {
    filters: [],
    paginationParams: {
      pageNumber: 1,
      pageSize: 100,
      sortColumn: '',
      sortDirection: ''
    }
  };

  this.reportService.getData(this.queryId, request)
    .subscribe({
      next: (res: ReportDataResponse) => {

        const col = this.filter.columnName;
        const values = res.rawData.map((x: any) => x[col]);

        console.log('RAW VALUES:', values);

        // ================= SINGLE SELECT =================
if (this.isSingleSelect() || this.isMultiSelect) {
  const uniqueValues = Array.from(new Set(values))
    .filter(v => v !== null && v !== undefined);  
  this.optionsFromApi = ['ALL', ...uniqueValues];
  console.log('OPTIONS LOADED:', this.optionsFromApi);
}
        // ================= VALUE RANGE =================
        if (this.isValueRange()) {

          const numbers = values
            .map((v: any) => Number(v))
            .filter((v: number) => !isNaN(v));

          this.minValue = Math.min(...numbers);
          this.maxValue = Math.max(...numbers);

          console.log('MIN:', this.minValue);
          console.log('MAX:', this.maxValue);
        }

        // ================= DATE =================
        if (this.isDate()) {

          const dates = values
            .map((v: any) => new Date(v))
            .filter((d: Date) => !isNaN(d.getTime()));

          const min = new Date(Math.min(...dates.map(d => d.getTime())));
          const max = new Date(Math.max(...dates.map(d => d.getTime())));

          this.minDate = min.toISOString().split('T')[0];
          this.maxDate = max.toISOString().split('T')[0];

          console.log('MIN DATE:', this.minDate);
          console.log('MAX DATE:', this.maxDate);
        }

      },
      error: (err) => {
        console.error('API ERROR:', err);
      }
    });
}
onTextChange(event: Event) {

  const value = (event.target as HTMLInputElement).value;

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: value
  };

  console.log('FILTER OBJECT:', this.selectedFilterObject);
}
onRangeChange() {

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: {
      min: this.minValue,
      max: this.maxValue
    }
  };

  console.log('FILTER OBJECT:', this.selectedFilterObject);
}
onDateChange() {

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: this.minDate
  };

  console.log('FILTER OBJECT:', this.selectedFilterObject);
}
// onSelectChange(event: Event) {

//   const value = (event.target as HTMLSelectElement).value;

//   this.selectedFilterObject = {
//     id: this.filter.id,
//     columnName: this.filter.columnName,
//     value: value
//   };

// this.valueChange.emit(this.selectedFilterObject);

// }
onSelectChange(event: Event) {

  const value = (event.target as HTMLSelectElement).value;

  this.selectedSingleValue = value;

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: value === 'ALL' ? null : value   // ⭐ المهم
  };

  this.valueChange.emit(this.selectedFilterObject);
}
submitRange() {

  this.selectedFilterObject = {
    id: this.filter.id,
    columnName: this.filter.columnName,
    value: {
      min: this.minValue,
      max: this.maxValue
    }
  };

console.log('FILTER OBJECT (RANGE SUBMIT):', this.selectedFilterObject);

  this.isRangeLocked = true;
  this.isExpanded = false; 
  this.valueChange.emit(this.selectedFilterObject); // ⭐ مهم
}

toggleExpand() {
  this.isExpanded = !this.isExpanded;
}
}


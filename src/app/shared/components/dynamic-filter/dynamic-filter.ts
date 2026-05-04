import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportDataResponse } from '../../../models/report-response.models';
import { EnFilterType } from '../../../models/enums.models';
import { FilterDefinition } from '../../../models/filter.models';
import { ReportDataRequest } from '../../../models/report-request.models';
import { ReportService } from '../../../core/services/report';
import { FilterSelectionModel, FilterValue } from '../../../models/filter-selection.model';
import { ChangeDetectorRef } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
@Component({
  selector: 'app-dynamic-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-filter.html',
  styleUrl: './dynamic-filter.css',
})
export class DynamicFilter implements OnInit , OnChanges{

  // ================= INPUTS =================
  @Input() filter!: FilterDefinition;
  @Input() queryId!: number;

  // ================= OUTPUTS =================
  @Output() remove = new EventEmitter<number>();
  @Output() reset = new EventEmitter<number>();
  @Output() valueChange = new EventEmitter<FilterSelectionModel>();

  // ================= STATE =================
  selectedSingleValue: string = 'ALL';
  selectedMultiValues: string[] = [];

  textValue: string = '';

  minValue: number | null = null;
  maxValue: number | null = null;

  minDate: string | null = null;
  maxDate: string | null = null;

  optionsFromApi: any[] = [];
  isExpanded: boolean = true;

  isDefaultLocked = false;
  isRangeLocked = false;
  isDateLocked = false;

  selectedFilterObject: FilterSelectionModel | null = null;

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  // ================= LIFECYCLE =================
  ngOnInit(): void {
    this.loadData();
  }
ngOnChanges(changes: SimpleChanges): void {
  if (changes['queryId'] || changes['filter']) {
    this.loadData();
  }
}
  // ================= UI ACTIONS =================
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
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  // ================= TYPE HELPERS =================
  get filterType(): string {
    return String(this.filter.type);
  }

  get filterTypeNormalized(): EnFilterType {
    return this.filter.type as EnFilterType;
  }

  isSingleSelect(): boolean {
    return this.filterType === '6' || this.filterType === 'SINGLE_SELECT_MENU';
  }

  isMultiSelect(): boolean {
    return (
      this.filterTypeNormalized === EnFilterType.MULTI_SELECT_MENU ||
      this.filterTypeNormalized === EnFilterType.CHECK_BOX
    );
  }

  isDefault(): boolean {
    return this.filter.type === EnFilterType.DEFAULT;
  }

  isValueRange(): boolean {
    return this.filter.type === EnFilterType.VALUE_RANGE;
  }

  isDate(): boolean {
    return this.filterType === '3' || this.filterType === 'DATE';
  }

  // ================= API LOAD =================
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
          const values =  res.rawData
  .map(x => x[col])
  .filter(v => v !== null && v !== undefined);
          // ============ SINGLE / MULTI ============
          if (this.isSingleSelect() || this.isMultiSelect()) {
            const uniqueValues = Array.from(new Set(values))
              .filter(v => v !== null && v !== undefined);

           setTimeout(() => {
          this.optionsFromApi = ['ALL', ...uniqueValues];
          this.cdr.detectChanges();
        });
      
          }

          // ============ RANGE ============
          if (this.isValueRange()) {

            const numbers = values
              .map((v: any) => Number(v))
              .filter((v: number) => !isNaN(v));

            this.minValue = Math.min(...numbers);
            this.maxValue = Math.max(...numbers);
          }

          // ============ DATE ============
          if (this.isDate()) {

            const dates = values
              .map((v: any) => new Date(v))
              .filter((d: Date) => !isNaN(d.getTime()));

            const min = new Date(Math.min(...dates.map(d => d.getTime())));
            const max = new Date(Math.max(...dates.map(d => d.getTime())));

            this.minDate = min.toISOString().split('T')[0];
            this.maxDate = max.toISOString().split('T')[0];
          }
        },
        error: (err) => console.error(err)
      });
  }

  // ================= BUILD FILTER OBJECT =================
  private emitText(value: string) {
  this.emitFilter(value);
}
private emitSelect(value: string | null) {
  this.emitFilter(value);
}
private emitMulti(values: string[]) {
  this.emitFilter([...values]);
}
private emitRange() {
  if (this.minValue == null || this.maxValue == null) return;

  this.emitFilter({
    min: this.minValue,
    max: this.maxValue
  });
}
private emitDate() {
  if (!this.minDate || !this.maxDate) return;

  this.emitFilter({
    from: this.minDate,
    to: this.maxDate
  });
}
  private emitFilter(value: FilterValue) {

    this.selectedFilterObject = {
      id: this.filter.id,
      columnName: this.filter.columnName,
      type: this.filter.type as EnFilterType,
      value: value
    };

    this.valueChange.emit(this.selectedFilterObject);
  }

  // ================= EVENTS =================

  submitDefault() {
    this.isDefaultLocked = true;
    this.isExpanded = false;

    this.emitText(this.textValue);
  }

  // onSelectChange(event: Event) {

  //   const value = (event.target as HTMLSelectElement).value;

  //   this.selectedSingleValue = value;

  // if (value === 'ALL') {
  //   return;
  // }

  // this.emitSelect(value);  }
onSelectChange(event: Event) {

  const value = (event.target as HTMLSelectElement).value;

  this.selectedSingleValue = value;

  if (value === 'ALL') {
    this.valueChange.emit({
      id: this.filter.id,
      columnName: this.filter.columnName,
      type: this.filter.type as EnFilterType,
      value: null   
    });
    return;
  }

  this.emitSelect(value);
} 
  onMultiSelectChange(event: Event) {

    const checkbox = event.target as HTMLInputElement;
    const value = checkbox.value;

    if (checkbox.checked) {
this.selectedMultiValues = [...this.selectedMultiValues, value];
    } else {
      this.selectedMultiValues =
        this.selectedMultiValues.filter(v => v !== value);
    }
  }

  submitMultiSelect() {
    this.isExpanded = false;
this.emitMulti(this.selectedMultiValues);  }

  onTextChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
   this.emitText(value);
  }

  onRangeChange() {
    this.emitFilter({
      min: this.minValue ?? 0,
    max: this.maxValue ?? 0
    });
  }

 submitRange() {

  if (this.minValue == null || this.maxValue == null) return;

  this.isRangeLocked = true;
  this.isExpanded = false;

  this.emitRange();
}

  onDateChange() {
 this.emitDate();
  }
}
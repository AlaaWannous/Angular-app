import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { ReportService } from '../../../core/services/report';
import { ReportDto } from '../../../models/report.models';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DynamicFilter } from '../../../shared/components/dynamic-filter/dynamic-filter';
import { FilterDefinition } from '../../../models/filter.models';
import { ReportDataRequest } from '../../../models/report-request.models';
import { FilterSelection } from '../../../models/filter.models';
import { EnFilterType } from '../../../models/enums.models';
import { FilterRole  } from '../../../models/enums.models';
import { PaginationParams } from '../../../models/pagination.models';
import { BehaviorSubject, switchMap } from 'rxjs';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FilterSelectionModel } from '../../../models/filter-selection.model';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, DynamicFilter,DragDropModule],
  templateUrl: './report-dashboard.html',
  styleUrls: ['./report-dashboard.css']
})
export class ReportDashboard {
private selectedSubReportId$ = new BehaviorSubject<number | null>(null);
private reloadData$ = new BehaviorSubject<void>(undefined);

tabs$: Observable<ReportDto[]>;
filters$ = this.selectedSubReportId$.pipe(
  switchMap(id =>
    id ? this.reportService.getFilters(id) : of([])
  )
);
// data$ = this.reloadData$.pipe(
//   switchMap(() => {
//     if (!this.selectedSubReportId) return [];

//     const payload = this.buildRequest();
//     return this.reportService.getData(this.selectedSubReportId, payload);
//   }),
//   tap(() => {
//     this.loading = false;
//   })
// );
  changeDetection!: ChangeDetectionStrategy.OnPush;
data$ = this.reloadData$.pipe(
  switchMap(() => {
    if (!this.selectedSubReportId) return of(null);

   // const payload = this.buildRequest();
    const payload: ReportDataRequest = {
    filters: [...this.submittedFilters],
    paginationParams: { ...this.pagination }
  };
    return this.reportService.getData(this.selectedSubReportId, payload);
  }),
  tap((res: any) => {

    this.loading = false;

    if (res?.rawData) {
this.currentData = [...res.rawData];
   
      this.currentColumns = Object.keys(res.rawData[0] || {});
    }
  })
);
loadingFilters = false;
selectedSubReportId!: number;
tableColumns: string[] = [];
//filters: FilterDefinition[] = [];
selectedFilters: FilterDefinition[] = [];
groupingFields: FilterDefinition[] = [];
groupedData: any[] = [];
rowData: any[] = [];
submittedFilters: FilterSelection[] = [];
pagination: PaginationParams = {
pageNumber: 1,
pageSize: 10,
sortColumn: '',
sortDirection: ''
};

loading = false;
currentData: any[] = [];
currentColumns: string[] = [];
sortedColumn: string = '';
sortDirection: 'ASC' | 'DESC' = 'ASC';
constructor(private reportService: ReportService,private cdr: ChangeDetectorRef) {
    this.tabs$ = this.reportService.getTabs();
  }

onSubReportClick(subReportId: number) {

    this.selectedSubReportId = subReportId;

  this.resetState();

  this.loadingFilters = true;

  this.filters$ = this.reportService.getFilters(subReportId);

  this.filters$.subscribe({
    next: () => {
      this.loadingFilters = false;
    },
    error: () => {
      this.loadingFilters = false;
    }
  });
}
drop(event: CdkDragDrop<FilterDefinition[]>) {

  console.log('DROP EVENT:', event);

  if (event.previousContainer === event.container) return;

  const item = event.previousContainer.data[event.previousIndex];

  console.log('ITEM DRAGGED:', item); 

  const exists = this.selectedFilters.some(f => f.id === item.id);

  if (!exists) {
    this.selectedFilters = [...this.selectedFilters, item];

    console.log('SELECTED FILTERS:', this.selectedFilters); 
  }
}

// onFilterChange(filter: FilterSelectionModel) {

//  const mapped: FilterSelection = {
//   id: filter.id,
//   columnName: filter.columnName,
//    type: filter.type,
//     value: filter.value,
//     role: FilterRole.WHERE
// };
//   this.upsertFilter(mapped);
//   console.log('SUBMITTED FILTERS:', this.submittedFilters);
// }
onFilterChange(filter: FilterSelectionModel) {

  if (filter.value == null) {
    this.submittedFilters = this.submittedFilters.filter(f => f.id !== filter.id);
    return;
  }

  const mapped: FilterSelection = {
    id: filter.id,
    columnName: filter.columnName,
    type: filter.type,
    value: filter.value,
    role: FilterRole.WHERE
  };

  this.upsertFilter(mapped);
}
onRemoveFilter(filterId: number) {

  this.selectedFilters = this.selectedFilters.filter(f => f.id !== filterId);

  this.submittedFilters = this.submittedFilters.filter(f => f.id !== filterId);

  console.log('AFTER REMOVE:', this.selectedFilters);
  
}

onResetFilter(filterId: number) {

  this.submittedFilters = this.submittedFilters.filter(f => f.id !== filterId);

  console.log('AFTER RESET:', this.submittedFilters);
}

onGroupingDrop(event: CdkDragDrop<FilterDefinition[]>) {

  if (event.previousContainer === event.container) return;

  const item = event.previousContainer.data[event.previousIndex];

  const exists = this.groupingFields.some(f => f.id === item.id);

  if (!exists) {
    this.groupingFields = [...this.groupingFields, item];

    this.onGroupingChange(item);
  }

  console.log('GROUPING FIELDS:', this.groupingFields);
}



onGroupingChange(filter: FilterDefinition) {

  const mapped: FilterSelection = {
    id: filter.id,
    columnName: filter.columnName,
    type: filter.type,
    value: null,
    role: FilterRole.GROUP
  };

  this.upsertFilter(mapped);
  console.log('GROUP FILTERS:', this.submittedFilters);
}


sendFilters() {

   this.loading = true;
  this.reloadData$.next();
  console.log('FINAL PAYLOAD:',  this.reloadData$);

}

nextPage() {
  this.pagination.pageNumber++;
  this.refreshData();
}

prevPage() {
  if (this.pagination.pageNumber > 1) {
    this.pagination.pageNumber--;
    this.refreshData();
  }
}

sort(column: string | number) {

  const col = String(column);

  if (this.pagination.sortColumn === col) {
    this.pagination.sortDirection =
      this.pagination.sortDirection === 'ASC' ? 'DESC' : 'ASC';
  } else {
    this.pagination.sortColumn = col;
    this.pagination.sortDirection = 'ASC';
  }

  this.refreshData();
}


getRowEntries(row: any) {
  return Object.entries(row);
}



buildGrouping() {

  const fields = this.groupingFields.map(f => f.columnName);

  if (!this.rowData || fields.length === 0) {
    this.groupedData = this.rowData;
    return;
  }

  const groupRecursive = (data: any[], level: number): any => {

    if (level >= fields.length) return data;

    const field = fields[level];

    return data.reduce((acc, item) => {

      const key = item[field] ?? 'NULL';

      if (!acc[key]) {
        acc[key] = {
          key,
          items: []
        };
      }

      acc[key].items.push(item);

      return acc;

    }, {} as any);

  };

  this.groupedData = groupRecursive(this.rowData, 0);

  console.log('GROUPED DATA:', this.groupedData);
}

onFilterSubmit(filter: FilterSelectionModel) {

  const original = this.selectedFilters.find(f => f.id === filter.id);
  if (!original) return;

  const mapped: FilterSelection = {
    id: filter.id,
    columnName: filter.columnName,
    type: original.type,
    value: filter.value,
    role: FilterRole.WHERE
  };

  const index = this.submittedFilters.findIndex(f => f.id === mapped.id);

  if (index > -1) {
    this.submittedFilters[index] = mapped;
  } else {
    this.submittedFilters = [
      ...this.submittedFilters.filter(f => !(f.id === mapped.id && f.role === FilterRole.WHERE)),
      mapped
    ];
  }

  console.log('SUBMITTED FILTERS:', this.submittedFilters);
}



private upsertFilter(filter: FilterSelection) {

  this.submittedFilters = [
    ...this.submittedFilters.filter(f => !(f.id === filter.id && f.role === filter.role)),
    filter
  ];

  console.log('UPDATED FILTERS:', this.submittedFilters);
}


private buildRequest(): ReportDataRequest {
    const paginationSnapshot: PaginationParams = {
    pageNumber: this.pagination.pageNumber,
    pageSize: this.pagination.pageSize,
    sortColumn: this.pagination.sortColumn,
    sortDirection: this.pagination.sortDirection
  };
  return {
    filters: this.submittedFilters,
    paginationParams: paginationSnapshot
  };
}





private refreshData() {
  if (!this.selectedSubReportId) return;
  this.sendFilters();
}

private resetState() {
  //this.filters = [];
  this.selectedFilters = [];
  this.submittedFilters = [];
  this.groupingFields = [];
  this.rowData = [];
  this.groupedData = [];  
}

exportToExcel() {

  if (!this.currentData || this.currentData.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.currentData);

  const workbook: XLSX.WorkBook = {
    Sheets: {
      'Report Data': worksheet
    },
    SheetNames: ['Report Data']
  };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const data: Blob = new Blob([excelBuffer], {
    type: 'application/octet-stream'
  });

  saveAs(data, `report_${new Date().getTime()}.xlsx`);
}


sortTable(column: string) {

  if (this.sortedColumn === column) {
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
  } else {
    this.sortedColumn = column;
    this.sortDirection = 'ASC';
  }

  this.pagination = {
    ...this.pagination,
    sortColumn: column,
    sortDirection: this.sortDirection
  };

  // reset page (مهم جداً في السيرفر sorting)
  this.pagination.pageNumber = 1;

  this.reloadData$.next();
}
}


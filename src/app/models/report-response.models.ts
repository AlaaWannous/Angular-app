import { AggregationType, EnFormatType } from './enums.models';
import { PaginationParams } from './pagination.models';

export interface ReportMetadata {
  id: number;
  columnName: string;
  alias: string;
  total: number;
  aggregationType: AggregationType;
  pipe: EnFormatType;
  displayColumn: boolean;
  sortable: boolean;
  distinct: boolean;
}

export interface ReportDataResponse {
  rawData: any[];
  metadata: ReportMetadata[];
  paginationParams: PaginationParams;
  totalRowsCount: number;
}
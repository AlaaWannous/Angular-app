import { FilterSelection } from './filter.models';
import { PaginationParams } from './pagination.models';

export interface ReportDataRequest {
  filters: FilterSelection[];
  paginationParams: PaginationParams;
}
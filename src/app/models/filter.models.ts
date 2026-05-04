import { EnFilterType, FilterRole } from './enums.models';

export interface FilterDefinition {
  id: number;
  columnName: string;
  type: EnFilterType;
  defaultValue: any | null;
  options: any[];
  pattern: string;
}

export interface FilterSelection {
  id: number;
  columnName: string;
  type: EnFilterType;
  value: any | null;
  role: FilterRole;
}
import { EnFilterType } from './enums.models';

export interface FilterSelectionModel {
  id: number;
  columnName: string;
  type: EnFilterType;
  value: FilterValue;
}

export type FilterValue =
  | string
  | number
  | boolean
  | { min: number | null; max: number | null }
  | { from: string | null; to: string | null };
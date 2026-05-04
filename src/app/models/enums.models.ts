export enum EnFilterType {
  DEFAULT = 0,
  CHECK_BOX = 1,
  RADIO_BTN = 2,
  DATE = 3,
  DATE_RANGE = 4,
  VALUE_RANGE = 5,
  SINGLE_SELECT_MENU = 6,
  MULTI_SELECT_MENU = 7,
}

export enum FilterRole {
  GROUP = 'GROUP',
  WHERE = 'WHERE',
}

export enum AggregationType {
  SUM = 0,
  COUNT = 1,
  MAX = 2,
  MIN = 3,
  AVG = 4,
}

export enum EnFormatType {
  NUMBER_DEF = 0,
  NUMBER_FIXED_3_DEC = 1,
  DATE_DD_MM_YYYY = 2,
  DATE_MM_YYYY = 3,
  DATE_EEE_D_MMM_YY = 4,
  DATE_TIME_MIN = 5,
  DATE_MON_YY = 6,
  DATE_DAY = 7,
  DATE_WITH_EEE = 8,
  TIME_MEDIUM = 9,
  PERCENTAGE = 10,
}
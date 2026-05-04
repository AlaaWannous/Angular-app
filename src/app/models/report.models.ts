export interface SubReportDto {
  id: number;
  name: string;
}

export interface ReportDto {
  id: number;
  name: string;
  subReports: SubReportDto[];
}
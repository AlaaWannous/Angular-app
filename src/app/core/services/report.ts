import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { ReportTabDto } from '../../models/report-tab.model';
import { ReportDto } from '../../models/report.models';
import { ReportDataResponse } from '../../models/report-response.models';
import { FilterDefinition } from '../../models/filter.models';
import { ReportDataRequest } from '../../models/report-request.models';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private baseUrl = 'http://localhost:5028/report';
   constructor(private http: HttpClient) {}

getTabs(): Observable<ReportDto[]> {
  return this.http.get<ReportDto[]>(`${this.baseUrl}/get-tabs`)
    .pipe(shareReplay(1));
  }

  getFilters(id: number): Observable<FilterDefinition[]> {
    return this.http.get<FilterDefinition[]>(`${this.baseUrl}/get-filters/${id}`);
  }

getData(queryId: number, payload: ReportDataRequest) {
  return this.http.post<ReportDataResponse>(
    `${this.baseUrl}/get-data/${queryId}`,
    payload
  );
}

}

import { Routes } from '@angular/router';
import { ReportDashboard } from './features/report/report-dashboard/report-dashboard';

export const routes: Routes = [
 // { path: '', component: ReportDashboard },
  {
    path: '',
    loadComponent: () =>
      import('./features/report/report-dashboard/report-dashboard')
        .then(m => m.ReportDashboard)
  }
];
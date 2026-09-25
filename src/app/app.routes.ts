import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterBusinessComponent } from './features/auth/register-business.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsListComponent } from './features/inventory/products-list.component';
import { StockManagementComponent } from './features/inventory/stock-management.component';
import { UsersListComponent } from './features/settings/users/users-list.component';
import { RolesListComponent } from './features/settings/roles/roles-list.component';

import { SalesInvoicesListComponent } from './features/sales/sales-invoices-list.component';
import { CreateInvoiceComponent } from './features/sales/create-invoice.component';
import { CustomersListComponent } from './features/sales/customers-list.component';

import { PurchaseOrdersListComponent } from './features/purchases/purchase-orders-list.component';
import { PurchaseBillsListComponent } from './features/purchases/purchase-bills-list.component';
import { SuppliersListComponent } from './features/purchases/suppliers-list.component';

import { ChartOfAccountsComponent } from './features/accounting/chart-of-accounts.component';
import { JournalEntriesComponent } from './features/accounting/journal-entries.component';
import { FinancialReportsComponent } from './features/accounting/financial-reports.component';

import { AuditLogsListComponent } from './features/settings/audit-logs/audit-logs-list.component';
import { BusinessProfileComponent } from './features/settings/business/business-profile.component';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: 'auth/register-business',
    component: RegisterBusinessComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'inventory',
        redirectTo: 'inventory/products',
        pathMatch: 'full'
      },
      {
        path: 'inventory/products',
        component: ProductsListComponent
      },
      {
        path: 'inventory/stock',
        component: StockManagementComponent
      },
      {
        path: 'sales',
        redirectTo: 'sales/invoices',
        pathMatch: 'full'
      },
      {
        path: 'sales/invoices',
        component: SalesInvoicesListComponent
      },
      {
        path: 'sales/create',
        component: CreateInvoiceComponent
      },
      {
        path: 'sales/customers',
        component: CustomersListComponent
      },
      {
        path: 'purchases',
        redirectTo: 'purchases/orders',
        pathMatch: 'full'
      },
      {
        path: 'purchases/orders',
        component: PurchaseOrdersListComponent
      },
      {
        path: 'purchases/bills',
        component: PurchaseBillsListComponent
      },
      {
        path: 'purchases/suppliers',
        component: SuppliersListComponent
      },
      {
        path: 'accounts',
        redirectTo: 'accounts/chart',
        pathMatch: 'full'
      },
      {
        path: 'accounts/chart',
        component: ChartOfAccountsComponent
      },
      {
        path: 'accounts/journals',
        component: JournalEntriesComponent
      },
      {
        path: 'accounts/reports',
        component: FinancialReportsComponent
      },
      {
        path: 'settings',
        redirectTo: 'settings/users',
        pathMatch: 'full'
      },
      {
        path: 'settings/users',
        component: UsersListComponent
      },
      {
        path: 'settings/roles',
        component: RolesListComponent
      },
      {
        path: 'settings/business',
        component: BusinessProfileComponent
      },
      {
        path: 'settings/audit-logs',
        component: AuditLogsListComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

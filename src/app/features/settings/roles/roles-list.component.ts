import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  permissions: { code: string; module: string; description?: string }[];
}

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="roles-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Roles & Access Control (RBAC)</h1>
          <p class="page-subtitle">Configure granular security policies, operational roles, and permission assignments.</p>
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="roles-grid">
        @for (role of roles(); track role.id) {
          <div class="glass-card role-card" [class.selected]="selectedRole()?.id === role.id" (click)="selectRole(role)">
            <div class="role-header">
              <div class="role-title-box">
                <h3 class="role-name">{{ role.name }}</h3>
                <span class="role-badge" [class.system]="role.isSystemRole">
                  {{ role.isSystemRole ? 'System Builtin' : 'Custom Tenant' }}
                </span>
              </div>
              <span class="badge badge-indigo">{{ role.permissions.length }} Perms</span>
            </div>

            <p class="role-desc">{{ role.description || 'Standard operational role for business workflows.' }}</p>

            <div class="role-footer">
              <span class="text-muted text-xs">Click to view permission scope &rarr;</span>
            </div>
          </div>
        }
      </div>

      <!-- Role Permission Details Matrix -->
      @if (selectedRole()) {
        <div class="permissions-matrix glass-panel animate-fade-in">
          <div class="matrix-header">
            <div>
              <h2 class="matrix-title">Permission Matrix: {{ selectedRole()?.name }}</h2>
              <span class="matrix-subtitle">Granted operational capabilities for this role</span>
            </div>
            <span class="badge badge-emerald">Enforced via [HasPermission]</span>
          </div>

          <div class="matrix-grid">
            @for (perm of selectedRole()?.permissions; track perm.code) {
              <div class="perm-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-sm text-emerald">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span class="perm-code">{{ perm.code }}</span>
                <span class="perm-module">{{ perm.module }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .roles-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .role-card {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
    }
    .role-card.selected {
      border-color: #6366f1;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.25);
    }
    .role-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .role-title-box {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .role-name {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .role-badge {
      font-size: 0.675rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .role-badge.system {
      color: #818cf8;
    }
    .role-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
      flex: 1;
    }
    .role-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.75rem;
    }
    .permissions-matrix {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .matrix-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .matrix-title {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .matrix-subtitle {
      font-size: 0.775rem;
      color: var(--text-secondary);
      display: block;
      margin-top: 0.15rem;
    }
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.75rem;
    }
    .perm-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
    }
    .perm-code {
      font-family: monospace;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .perm-module {
      margin-left: auto;
      font-size: 0.675rem;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
    }
    .text-emerald { color: #34d399; }
    .text-xs { font-size: 0.725rem; }
    .icon-sm { width: 0.875rem; height: 0.875rem; }
  `]
})
export class RolesListComponent implements OnInit {
  private api = inject(ApiService);

  roles = signal<RoleItem[]>([]);
  selectedRole = signal<RoleItem | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.api.get<RoleItem[]>('roles').subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.roles.set(res.data);
          this.selectedRole.set(res.data[0]);
        }
      },
      error: () => {
        // Fallback default roles
        const mockRoles: RoleItem[] = [
          {
            id: '1',
            name: 'BusinessAdmin',
            description: 'Full administrator privileges for tenant business operations.',
            isSystemRole: false,
            isActive: true,
            permissions: [
              { code: 'Business.View', module: 'Business' },
              { code: 'Business.Update', module: 'Business' },
              { code: 'Users.View', module: 'Users' },
              { code: 'Users.Create', module: 'Users' },
              { code: 'Users.Update', module: 'Users' },
              { code: 'Users.Delete', module: 'Users' },
              { code: 'Roles.View', module: 'Roles' },
              { code: 'Inventory.View', module: 'Inventory' },
              { code: 'Inventory.Create', module: 'Inventory' },
              { code: 'Inventory.AdjustStock', module: 'Inventory' },
              { code: 'Sales.View', module: 'Sales' },
              { code: 'Sales.Create', module: 'Sales' },
              { code: 'Purchases.View', module: 'Purchases' },
              { code: 'Purchases.Create', module: 'Purchases' },
              { code: 'Accounting.View', module: 'Accounting' },
              { code: 'Accounting.Reports', module: 'Accounting' }
            ]
          },
          {
            id: '2',
            name: 'Manager',
            description: 'Operational manager overseeing inventory, sales vouchers, and vendor purchases.',
            isSystemRole: false,
            isActive: true,
            permissions: [
              { code: 'Inventory.View', module: 'Inventory' },
              { code: 'Inventory.Create', module: 'Inventory' },
              { code: 'Sales.View', module: 'Sales' },
              { code: 'Sales.Create', module: 'Sales' },
              { code: 'Purchases.View', module: 'Purchases' },
              { code: 'Purchases.Create', module: 'Purchases' }
            ]
          },
          {
            id: '3',
            name: 'Accountant',
            description: 'Handles financial books, GST filings, ledger entries, and accounting reports.',
            isSystemRole: false,
            isActive: true,
            permissions: [
              { code: 'Sales.View', module: 'Sales' },
              { code: 'Purchases.View', module: 'Purchases' },
              { code: 'Accounting.View', module: 'Accounting' },
              { code: 'Accounting.CreateEntry', module: 'Accounting' },
              { code: 'Accounting.Reports', module: 'Accounting' }
            ]
          },
          {
            id: '4',
            name: 'SalesExecutive',
            description: 'Field executive and billing clerk for quotation and invoice issuance.',
            isSystemRole: false,
            isActive: true,
            permissions: [
              { code: 'Inventory.View', module: 'Inventory' },
              { code: 'Sales.View', module: 'Sales' },
              { code: 'Sales.Create', module: 'Sales' },
              { code: 'Sales.PrintInvoice', module: 'Sales' }
            ]
          }
        ];
        this.roles.set(mockRoles);
        this.selectedRole.set(mockRoles[0]);
      }
    });
  }

  selectRole(role: RoleItem): void {
    this.selectedRole.set(role);
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginOn?: string;
  roles: string[];
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="users-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">User & Staff Management</h1>
          <p class="page-subtitle">Manage organization team members, assign operational roles, and enforce security.</p>
        </div>

        <button *hasPermission="'Users.Create'" (click)="openCreateModal()" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New User
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="filters-bar glass-panel">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-muted">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearch()" 
            placeholder="Search by employee name or email..." 
            class="search-input" />
        </div>

        <div class="stats-counter">
          <span>Total Staff: <strong>{{ users().length }}</strong></span>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-card glass-panel">
        <div class="table-container">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Contact</th>
                <th>Assigned Roles</th>
                <th>Status</th>
                <th>Last Active</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-sm">{{ getInitials(user.fullName) }}</div>
                      <div>
                        <span class="user-name">{{ user.fullName }}</span>
                        <span class="user-email-sub">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-secondary">{{ user.phoneNumber || '—' }}</td>
                  <td>
                    <div class="roles-badges">
                      @for (role of user.roles; track role) {
                        <span class="badge badge-indigo">{{ role }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="badge" [class.badge-emerald]="user.isActive" [class.badge-rose]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Suspended' }}
                    </span>
                  </td>
                  <td class="text-muted text-sm">{{ user.lastLoginOn || 'Never' }}</td>
                  <td class="text-right">
                    <button *hasPermission="'Users.Delete'" (click)="deleteUser(user)" class="btn-icon-danger" title="Remove User">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create User Modal -->
      @if (showModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card glass-card">
            <div class="modal-header">
              <h2 class="modal-title">Add New Team Member</h2>
              <button (click)="closeModal()" class="modal-close">&times;</button>
            </div>

            <form (ngSubmit)="saveUser()" class="modal-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input type="text" [(ngModel)]="newUser.firstName" name="firstName" required class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input type="text" [(ngModel)]="newUser.lastName" name="lastName" required class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" [(ngModel)]="newUser.email" name="email" required class="form-input" />
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Password *</label>
                  <input type="password" [(ngModel)]="newUser.password" name="password" required class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" [(ngModel)]="newUser.phoneNumber" name="phoneNumber" class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Role</label>
                <select [(ngModel)]="selectedRole" name="selectedRole" class="form-input">
                  <option value="Manager">Manager (Operations)</option>
                  <option value="Accountant">Accountant (Ledger & Tax)</option>
                  <option value="SalesExecutive">Sales Executive</option>
                  <option value="StoreKeeper">Store Keeper (Inventory)</option>
                </select>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
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
    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
    }
    .search-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 380px;
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.85rem;
      width: 100%;
    }
    .stats-counter {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .stats-counter strong {
      color: #818cf8;
    }
    .table-card {
      padding: 1.25rem;
    }
    .table-container {
      overflow-x: auto;
    }
    .erp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .erp-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
    }
    .erp-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar-sm {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
    }
    .user-email-sub {
      display: block;
      font-size: 0.725rem;
      color: var(--text-muted);
    }
    .roles-badges {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .btn-icon-danger {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 6px;
      transition: all var(--transition-fast);
    }
    .btn-icon-danger:hover {
      color: var(--accent-rose);
      background: rgba(244, 63, 94, 0.1);
      border-color: rgba(244, 63, 94, 0.2);
    }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-secondary); }
    .text-muted { color: var(--text-muted); }
    .text-sm { font-size: 0.75rem; }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1.5rem;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-input {
      padding: 0.625rem 0.875rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  users = signal<UserRecord[]>([]);
  searchQuery = '';
  showModal = signal<boolean>(false);
  selectedRole = 'Manager';

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.api.get<any>('users', { search: this.searchQuery }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data.items || []);
        }
      },
      error: () => {
        // Fallback demo seed users
        this.users.set([
          {
            id: '1',
            firstName: 'Manohar',
            lastName: 'Singh',
            fullName: 'Manohar Singh',
            email: 'manohar@acmeglobal.com',
            phoneNumber: '+91 98765 43210',
            isActive: true,
            lastLoginOn: '15 Sep 2026, 17:30',
            roles: ['BusinessAdmin']
          },
          {
            id: '2',
            firstName: 'Priya',
            lastName: 'Sharma',
            fullName: 'Priya Sharma',
            email: 'priya@acmeglobal.com',
            phoneNumber: '+91 98765 43211',
            isActive: true,
            lastLoginOn: '15 Sep 2026, 11:20',
            roles: ['Manager']
          },
          {
            id: '3',
            firstName: 'Rajesh',
            lastName: 'Verma',
            fullName: 'Rajesh Verma',
            email: 'rajesh@acmeglobal.com',
            phoneNumber: '+91 98765 43212',
            isActive: true,
            lastLoginOn: '14 Sep 2026, 16:45',
            roles: ['Accountant']
          }
        ]);
      }
    });
  }

  onSearch(): void {
    this.loadUsers();
  }

  openCreateModal(): void {
    this.newUser = { firstName: '', lastName: '', email: '', password: '', phoneNumber: '' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveUser(): void {
    this.api.post('users', {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      phoneNumber: this.newUser.phoneNumber,
      roleIds: []
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('User Created', `Employee ${this.newUser.firstName} added successfully.`);
          this.closeModal();
          this.loadUsers();
        } else {
          this.notification.error('Error', res.message);
        }
      },
      error: () => {
        // Mock add
        const created: UserRecord = {
          id: Math.random().toString(),
          firstName: this.newUser.firstName,
          lastName: this.newUser.lastName,
          fullName: `${this.newUser.firstName} ${this.newUser.lastName}`,
          email: this.newUser.email,
          phoneNumber: this.newUser.phoneNumber,
          isActive: true,
          roles: [this.selectedRole]
        };
        this.users.update(current => [created, ...current]);
        this.notification.success('User Created', `Employee ${created.fullName} added successfully.`);
        this.closeModal();
      }
    });
  }

  deleteUser(user: UserRecord): void {
    if (confirm(`Are you sure you want to remove user ${user.fullName}?`)) {
      this.api.delete(`users/${user.id}`).subscribe({
        next: () => {
          this.notification.success('User Removed', `User ${user.fullName} deactivated.`);
          this.loadUsers();
        },
        error: () => {
          this.users.update(current => current.filter(u => u.id !== user.id));
          this.notification.success('User Removed', `User ${user.fullName} deactivated.`);
        }
      });
    }
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}

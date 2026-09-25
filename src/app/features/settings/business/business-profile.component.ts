import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BusinessProfile } from '../../../core/models/dashboard.models';
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="business-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Business Tenant Settings & Tax Profile</h1>
          <p class="page-subtitle">Manage legal corporate entity information, GSTIN identifiers, and base ERP parameters.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/settings/users" class="btn btn-secondary">Staff Accounts</a>
          <a routerLink="/settings/roles" class="btn btn-secondary">Roles & Security</a>
          <a routerLink="/settings/audit-logs" class="btn btn-secondary">Audit Trail</a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <span>Loading business profile...</span>
        </div>
      } @else if (profile()) {
        <div class="profile-card">
          <div class="profile-header">
            <div class="brand-avatar">
              {{ profile()!.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="brand-details">
              <h2 class="brand-name">{{ profile()!.name }}</h2>
              <span class="brand-code font-mono">Tenant Code: {{ profile()!.businessCode }}</span>
            </div>
            <div class="status-badge-wrap ml-auto">
              <span class="badge badge-emerald">{{ profile()!.isActive ? 'Active Tenant' : 'Inactive' }}</span>
              <span class="badge badge-indigo">Base: {{ profile()!.currency }}</span>
            </div>
          </div>

          <form (ngSubmit)="saveProfile()" class="profile-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Trade Display Name *</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.name"
                  name="name"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Legal Registered Name</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.legalName"
                  name="legalName"
                  placeholder="e.g. Acme Global Technologies Private Limited"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">GSTIN (15-digit GST Identifier)</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.gstNumber"
                  name="gstNumber"
                  placeholder="27AAACA1234A1Z5"
                  class="form-input font-mono"
                />
              </div>

              <div class="form-group">
                <label class="form-label">PAN (10-digit Income Tax Number)</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.panNumber"
                  name="panNumber"
                  placeholder="AAACA1234A"
                  class="form-input font-mono"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Official Email Address *</label>
                <input
                  type="email"
                  [(ngModel)]="editModel.email"
                  name="email"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Official Phone Number</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.phone"
                  name="phone"
                  placeholder="+91 22 2490 1100"
                  class="form-input"
                />
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Registered Corporate Address</label>
                <textarea
                  [(ngModel)]="editModel.address"
                  name="address"
                  rows="3"
                  placeholder="Plot No 44, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093"
                  class="form-input form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Default Reporting Currency</label>
                <input
                  type="text"
                  [(ngModel)]="editModel.currency"
                  name="currency"
                  class="form-input font-mono"
                  disabled
                />
                <span class="form-hint">Base ledger currency for Acme Global Ltd is locked to INR (₹).</span>
              </div>
            </div>

            <div class="form-actions">
              <button
                *hasPermission="'Business.Update'"
                type="submit"
                class="btn btn-primary"
                [disabled]="saving()"
              >
                {{ saving() ? 'Saving Changes...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .business-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .profile-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }
    .brand-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      box-shadow: 0 4px 16px var(--primary-glow);
    }
    .brand-details {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .brand-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .brand-code {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .status-badge-wrap {
      display: flex;
      gap: 0.5rem;
    }
    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .col-span-2 {
      grid-column: span 2;
    }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-input {
      padding: 0.6rem 0.85rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .form-input:focus {
      border-color: #6366f1;
      outline: none;
    }
    .form-textarea {
      resize: vertical;
    }
    .form-hint {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem;
      color: var(--text-secondary);
    }
    .ml-auto { margin-left: auto; }
  `]
})
export class BusinessProfileComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private notification = inject(NotificationService);

  profile = signal<BusinessProfile | null>(null);
  loading = signal(false);
  saving = signal(false);
  editModel: Partial<BusinessProfile> = {};

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.dashboardService.getBusinessProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.editModel = { ...res.data };
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load business profile.');
      }
    });
  }

  saveProfile(): void {
    if (!this.editModel.name || !this.editModel.email) {
      this.notification.warning('Business name and email are required.');
      return;
    }

    this.saving.set(true);
    this.dashboardService.updateBusinessProfile(this.editModel).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.notification.success('Business profile updated successfully.');
        } else {
          this.notification.error(res.message || 'Failed to update profile.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.notification.error(err.error?.message || 'Error occurred while saving profile.');
      }
    });
  }
}

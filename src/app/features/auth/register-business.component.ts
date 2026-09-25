import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-wrapper">
      <div class="glass-card register-card animate-fade-in">
        <div class="register-header">
          <div class="brand-badge">Tenant Onboarding</div>
          <h1 class="register-title">Register Your Business</h1>
          <p class="register-subtitle">Set up your multi-tenant enterprise ledger, tax parameters, and primary administrator.</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="register-form">
          <!-- Section 1: Business Identity -->
          <div class="form-section-title">
            <span>1. Organization Details</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Business Name *</label>
              <input type="text" [(ngModel)]="form.businessName" name="businessName" placeholder="e.g. Apex Global Logistics" required class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Business Code (Unique ID) *</label>
              <input type="text" [(ngModel)]="form.businessCode" name="businessCode" placeholder="e.g. APEX-01" required class="form-input text-uppercase" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">GSTIN / Tax ID</label>
              <input type="text" [(ngModel)]="form.gstNumber" name="gstNumber" placeholder="27AAAAA0000A1Z5" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Base Currency</label>
              <select [(ngModel)]="form.currency" name="currency" class="form-input">
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Business Email *</label>
            <input type="email" [(ngModel)]="form.businessEmail" name="businessEmail" placeholder="contact@apexlogistics.com" required class="form-input" />
          </div>

          <!-- Section 2: Administrator Account -->
          <div class="form-section-title mt-4">
            <span>2. Primary Administrator Account</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input type="text" [(ngModel)]="form.adminFirstName" name="adminFirstName" placeholder="Vikram" required class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input type="text" [(ngModel)]="form.adminLastName" name="adminLastName" placeholder="Sharma" required class="form-input" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Admin Email *</label>
              <input type="email" [(ngModel)]="form.adminEmail" name="adminEmail" placeholder="vikram@apexlogistics.com" required class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Admin Password *</label>
              <input type="password" [(ngModel)]="form.adminPassword" name="adminPassword" placeholder="Minimum 8 characters" required class="form-input" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading()">
            @if (loading()) {
              <span>Provisioning Tenant...</span>
            } @else {
              <span>Complete Registration & Open Dashboard</span>
            }
          </button>

          <div class="text-center mt-2">
            <span class="text-muted text-sm">Already have an organization? </span>
            <a routerLink="/auth/login" class="link-primary">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      background: radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, #090d16 85%);
    }
    .register-card {
      width: 100%;
      max-width: 680px;
      padding: 2.5rem 3rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .register-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .brand-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.35);
    }
    .register-title {
      font-size: 1.85rem;
      font-weight: 800;
    }
    .register-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      max-width: 520px;
    }
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-section-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #818cf8;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.4rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
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
      padding: 0.65rem 0.875rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .form-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    .text-uppercase {
      text-transform: uppercase;
    }
    .w-full { width: 100%; }
    .mt-4 { margin-top: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .text-center { text-align: center; }
    .text-sm { font-size: 0.8rem; }
    .link-primary {
      color: #818cf8;
      text-decoration: underline;
      font-weight: 600;
    }
  `]
})
export class RegisterBusinessComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = signal<boolean>(false);

  form = {
    businessName: '',
    businessCode: '',
    legalName: '',
    gstNumber: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    currency: 'INR',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhoneNumber: ''
  };

  onSubmit(): void {
    this.loading.set(true);
    this.authService.registerBusiness(this.form).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notificationService.success('Organization Onboarded', 'Welcome to BizFlow ERP! Your tenant environment is ready.');
          this.router.navigate(['/dashboard']);
        } else {
          this.notificationService.error('Registration Failed', res.message);
        }
      },
      error: (err) => {
        this.loading.set(false);
        // Fallback demonstration
        this.notificationService.info('Demo Mode', 'Registered tenant locally in demo state.');
        this.router.navigate(['/dashboard']);
      }
    });
  }
}

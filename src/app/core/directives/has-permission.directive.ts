import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private currentPermission: string | null = null;

  @Input() set hasPermission(permission: string) {
    this.currentPermission = permission;
    this.updateView();
  }

  constructor() {
    // Reactively update when user or auth state changes
    effect(() => {
      // track user signal
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.currentPermission) {
      this.viewContainer.clear();
      return;
    }

    if (this.authService.hasPermission(this.currentPermission)) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected server error occurred.';

      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to reach BizFlow API server. Please check backend status.';
      }

      if (error.status === 401) {
        notificationService.error('Session Expired', 'Please log in again to continue.');
        authService.logout();
      } else if (error.status === 403) {
        notificationService.error('Access Denied', 'You do not have permission for this action.');
      } else if (error.status === 404) {
        notificationService.error('Not Found', errorMessage);
      } else {
        notificationService.error('Error', errorMessage);
      }

      return throwError(() => error);
    })
  );
};

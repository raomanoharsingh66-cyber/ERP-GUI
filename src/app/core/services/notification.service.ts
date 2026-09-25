import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<ToastMessage[]>([]);

  show(type: ToastMessage['type'], title: string, message: string, duration = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message };

    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(titleOrMessage: string, message?: string): void {
    if (!message) {
      this.show('success', 'Success', titleOrMessage);
    } else {
      this.show('success', titleOrMessage, message);
    }
  }

  error(titleOrMessage: string, message?: string): void {
    if (!message) {
      this.show('error', 'Error', titleOrMessage, 6000);
    } else {
      this.show('error', titleOrMessage, message, 6000);
    }
  }

  warning(titleOrMessage: string, message?: string): void {
    if (!message) {
      this.show('warning', 'Warning', titleOrMessage, 5000);
    } else {
      this.show('warning', titleOrMessage, message, 5000);
    }
  }

  info(titleOrMessage: string, message?: string): void {
    if (!message) {
      this.show('info', 'Info', titleOrMessage);
    } else {
      this.show('info', titleOrMessage, message);
    }
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}

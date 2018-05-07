import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Alert } from './alert';

@Injectable()
export class NotificationService {
  private alerts: BehaviorSubject<Alert[]> = new BehaviorSubject<Alert[]>([]);
  private data: Alert[] = [];

  constructor() { }

  public success(message: string): void {
    this.updateAlerts(new Alert(message, 'success'));
  }

  public info(message: string): void {
    this.updateAlerts(new Alert(message, 'info'));
  }

  public warn(message: string): void {
    this.updateAlerts(new Alert(message, 'warning'));
  }

  public danger(message: string): void {
    this.updateAlerts(new Alert(message, 'danger'));
  }

  public dismiss(alert: Alert): void {
    const index: number = this.data.indexOf(alert);
    this.data.splice(index, 1);
    this.alerts.next(this.data);
  }

  private updateAlerts(alert: Alert) {
    this.data.push(alert);
    this.alerts.next(this.data);
    setTimeout(alert => {
      this.dismiss(alert);
    }, 5000);
  }

  get watchAlerts(): Observable<Alert[]> {
    return this.alerts.asObservable();
  }
}

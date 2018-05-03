import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Alert } from './alert';

@Injectable()
export class NotificationService {
  alerts: BehaviorSubject<Alert[]> = new BehaviorSubject<Alert[]>([]);
  data: Alert[] = [];

  constructor() { }

  public success(message: string): void {
    this.data.push(new Alert(message, 'success'));
    this.updateAlerts();
  }

  public info(message: string): void {
    this.data.push(new Alert(message, 'info'));
    this.updateAlerts();
  }

  public warn(message: string): void {
    this.data.push(new Alert(message, 'warning'));
    this.updateAlerts();
  }

  public danger(message: string): void {
    this.data.push(new Alert(message, 'danger'));
    this.updateAlerts();
  }

  public dismiss(alert: Alert): void {
    const index: number = this.data.indexOf(alert);
    this.data.splice(index, 1);
    this.updateAlerts();
  }

  private updateAlerts() {
    console.log("Notification Service Called");
    this.alerts.next(this.data);
  }

  get watchAlerts(): Observable<Alert[]> {
    return this.alerts.asObservable();
  }
}

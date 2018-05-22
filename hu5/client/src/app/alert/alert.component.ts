import { Component, OnInit } from '@angular/core';
import { Alert } from '../alert';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  alerts: Alert[] = [];

  constructor(private notificationService: NotificationService) { }

  ngOnInit() {
    this.notificationService.watchAlerts.subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  close(alert: Alert) {
    this.notificationService.dismiss(alert);
  }

}

import { Component } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { User } from './user';
import { NotificationService } from './notification.service';
import { Alert } from './alert';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  user: User;
  alerts: Array<Alert> = [];

  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService){
  }

  ngOnInit() {
    this.authenticationService.watchUser.subscribe(user => {
      this.user = user;
    });
    this.notificationService.watchAlerts.subscribe(alerts => {
      this.alerts = alerts;
    })
  }

  close(alert: Alert) {
    this.notificationService.dismiss(alert);
  }
}

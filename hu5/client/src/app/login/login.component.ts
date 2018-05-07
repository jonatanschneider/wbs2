import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';

  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
  }

  login(event) {
    event.preventDefault();
    this.username = this.username.trim();
    this.password = this.password.trim();

    if (!this.username) {
      this.notificationService.warn('Enter username');
      return;
    } else if (this.password) {
      this.authenticationService.login(this.username, this.password).subscribe(user => {
        if (user) {
          this.notificationService.success('Successfully logged in');
        } else {
          this.notificationService.danger('Login failed');
        }
      });
    } else {
      this.notificationService.warn('Enter password');
    }
  }
}

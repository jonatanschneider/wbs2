import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router) { }

  ngOnInit() {
  }

  logout() {
    this.authenticationService.logout().subscribe(() => {
      this.notificationService.success("Successfully logged out");
      this.router.navigate(['/']);
    });
  }
}

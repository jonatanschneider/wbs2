import { Component } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { User } from './user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  user: User;

  constructor(private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.authenticationService.watchUser.subscribe(user => {
      this.user = user;
    });
  }
}

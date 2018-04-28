import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = "";
  password: string = "";

  constructor(private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
  }

  login(event) {
    event.preventDefault();
    this.username = this.username.trim();
    this.password = this.password.trim();

    if (this.password) {
      this.authenticationService.login(this.username, this.password).subscribe(user => {
        if (user) {
          console.log("Successfully logged in");
        } else {
          console.log("Login failed");
        }
      })
    } else {
      console.log("Enter password");
    }
  }
}

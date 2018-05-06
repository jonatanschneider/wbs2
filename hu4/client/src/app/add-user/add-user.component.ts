import { Component } from '@angular/core';
import { User } from "../user";
import { UserService } from "../user.service";
import { NotificationService } from "../notification.service";

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent {
  username: string;
  vorname: string;
  nachname: string;
  password: string;

  constructor(private userService: UserService, private notificationService: NotificationService) {
  }

  add() {
    if(!this.username)  {
      this.notificationService.danger("Username must be set");
      return;
    } else if(!this.password){
      this.notificationService.danger("Password must be set");
      return;
    }
    this.userService.addUser(new User(this.username, "", this.vorname, this.nachname, this.password))
      .subscribe(result => {
        if(result) {
          this.notificationService.success("User created.");
          this.clear();
        } else {
          this.notificationService.danger("User could not be created.");
        }
      });
  }

  clear() {
    this.username = '';
    this.vorname = '';
    this.nachname = '';
    this.password = '';
  }
}

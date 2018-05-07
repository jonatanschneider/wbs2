import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent {
    username: string;
    vorname: string;
    nachname: string;
    password: string;

    constructor(private userService: UserService,
                private router: Router) {
    }

    add() {
        if(!this.username)  {
            // this.notificationService.danger("Username must be set");
            return;
        } else if(!this.password){
            // this.notificationService.danger("Password must be set");
            return;
        }
        this.userService.addUser(new User(this.username, "", this.vorname, this.nachname, this.password))
            .subscribe(result => {
                if(result) {
                    // this.notificationService.success("User created.");
                    this.clear();
                    this.router.navigate(['/users']);
                } else {
                    // this.notificationService.danger("User could not be created.");
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

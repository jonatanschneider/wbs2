import { Component, OnInit } from '@angular/core';
import { User } from '../user';
import { UserService } from '../user.service';
import { EdituserComponent } from '../edituser/edituser.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.css']
})
export class UserlistComponent implements OnInit {
  users: User[];

  constructor(private modalService: NgbModal,
              private notificationService: NotificationService,
              private userService: UserService) {
  }

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  deleteUser(user: User) {
    this.userService.delete(user).subscribe(result => {
      if(result) {
        this.users.splice(this.users.findIndex(listItem => user === listItem), 1);
      }
    });
  }

  editUser(user: User) {
    const modalReference = this.modalService.open(EdituserComponent);
    modalReference.componentInstance.setUser(user);
    modalReference.result
      .then((user: User) => {
        this.userService.updateUser(user).subscribe(success => {
          if(success){
            this.notificationService.success("User " + user.username + " successfully updated");
          } else {
            this.notificationService.danger("User " + user.username + " could not be updated");
          }
        });
      })
      .catch((error) => {
        // ToDo: Call NotificationService
        console.log("Window closed: " + error);
      });
  }
}

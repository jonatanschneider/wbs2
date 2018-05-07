import { Component, OnInit } from '@angular/core';
import { User } from '../user';
import { UserService } from '../user.service';
import { EdituserComponent } from '../edituser/edituser.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../notification.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.scss']
})
export class UserlistComponent implements OnInit {
  users: User[];

  constructor(private modalService: NgbModal,
              private notificationService: NotificationService,
              private userService: UserService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
    this.route.params.subscribe((params: any) => {
      if(params['id'] != undefined) {
        this.userService.getUser(params['id']).subscribe(user => {
          if (user) {
            this.editUser(user);
          }
        });
      }
    })
  }

  deleteUser(user: User) {
    this.userService.delete(user).subscribe(result => {
      if (result) {
        this.notificationService.success('User ' + user.username + ' successfully deleted');
        this.users.splice(this.users.findIndex(listItem => user === listItem), 1);
      } else {
        this.notificationService.danger('User ' + user.username + ' could not be deleted');
      }
    });
  }

  editUser(user: User) {
    this.location.go('/users/' + user.id);
    const modalReference = this.modalService.open(EdituserComponent);
    modalReference.componentInstance.setUser(user);
    modalReference.result
      .then((user: User) => {
        this.location.go('/users');
        this.userService.updateUser(user).subscribe(success => {
          if (success) {
            this.notificationService.success('User ' + user.username + ' successfully updated');
            this.users.splice(this.users.findIndex(listItem => user.id === listItem.id), 1, user);
          } else {
            this.notificationService.danger('User ' + user.username + ' could not be updated');
          }
        });
      })
      .catch(() => {
        this.location.go('/users');
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { User } from './user';
import { UserService } from './user.service';
import { EditComponent } from './edit/edit.component';
import { Location } from '@angular/common';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    users: User[];

    constructor(private modalService: NgbModal,
                private userService: UserService,
                private route: ActivatedRoute,
                private location: Location) {
    }

    ngOnInit() {
        this.userService.getUsers().subscribe(users => {
            this.users = users;
        });
        this.route.params.subscribe((params: any) => {
            if (params['id'] != undefined) {
                this.userService.getUser(params['id']).subscribe(user => {
                    if (user) {
                        this.editUser(user);
                    }
                });
            }
        });
    }

    deleteUser(user: User) {
        this.userService.delete(user).subscribe(result => {
            if (result) {
                // this.notificationService.success('User ' + user.username + ' successfully deleted');
                this.users.splice(this.users.findIndex(listItem => user === listItem), 1);
            } else {
                // this.notificationService.danger('User ' + user.username + ' could not be deleted');
            }
        });
    }

    editUser(user: User) {
        this.location.go('/users/edit/' + user.id);
        const modalReference = this.modalService.open(EditComponent);
        modalReference.componentInstance.setUser(user);
        modalReference.result
            .then((user: User) => {
                this.location.go('/users');
                this.userService.updateUser(user).subscribe(success => {
                    if (success) {
                        // this.notificationService.success('User ' + user.username + ' successfully updated');
                        this.users.splice(this.users.findIndex(listItem => user.id === listItem.id), 1, user);
                    } else {
                        // this.notificationService.danger('User ' + user.username + ' could not be updated');
                    }
                });
            })
            .catch(() => {
                this.location.go('/users');
            });
    }
}

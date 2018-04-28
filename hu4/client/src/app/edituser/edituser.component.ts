import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-edituser',
  templateUrl: './edituser.component.html',
  styleUrls: ['./edituser.component.css']
})
export class EdituserComponent implements OnInit {
  user: User;
  vorname: string;
  nachname: string;
  password: string;

  constructor(private activeModal: NgbActiveModal,
              private userService: UserService) { }

  ngOnInit() {
    this.vorname = this.user.vorname;
    this.nachname = this.user.nachname;
  }

  save() {
    this.activeModal.close(new User(this.user.username, this.user.id, this.vorname, this.nachname, this.password));
  }

  debug() {
    console.log("User: " + this.user);
    console.log("first name field: " + this.vorname);
    console.log("last name field: " + this.nachname);
    console.log("password field: " + this.password);
  }

  close() {
    this.activeModal.dismiss();
  }

}

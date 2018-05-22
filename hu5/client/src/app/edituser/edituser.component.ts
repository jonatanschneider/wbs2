import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../user';

@Component({
  selector: 'app-edituser',
  templateUrl: './edituser.component.html',
  styleUrls: ['./edituser.component.scss']
})
export class EdituserComponent implements OnInit {
  user: User;

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

  setUser(user: User): void {
    this.user = new User(user.username, user.id, user.vorname, user.nachname, user.password);
  }

  save() {
    this.activeModal.close(this.user);
  }

  close() {
    this.activeModal.dismiss();
  }
}

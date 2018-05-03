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

  constructor(private activeModal: NgbActiveModal,
              private userService: UserService) { }

  ngOnInit() {
  }

  save() {
    this.activeModal.close(this.user);
  }

  close() {
    this.activeModal.dismiss();
  }

}

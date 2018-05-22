import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from '../user';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
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

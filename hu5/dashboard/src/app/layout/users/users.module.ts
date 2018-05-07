import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersComponent } from './users.component';
import { UsersRoutingModule } from './users-routing.module';
import { AddComponent } from './add/add.component';
import { EditComponent } from './edit/edit.component';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalStack } from '@ng-bootstrap/ng-bootstrap/modal/modal-stack';
import { UserService } from './user.service';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [CommonModule, FormsModule, UsersRoutingModule, NgbModule.forRoot()],
    declarations: [UsersComponent, AddComponent, EditComponent],
    providers: [NgbModal, NgbModalStack, UserService],
    entryComponents: [EditComponent]
})
export class UsersModule {}

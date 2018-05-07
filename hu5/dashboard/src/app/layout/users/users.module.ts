import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersComponent } from './users.component';
import { UsersRoutingModule } from './users-routing.module';
import { AddComponent } from './add/add.component';

@NgModule({
    imports: [CommonModule, UsersRoutingModule],
    declarations: [UsersComponent, AddComponent]
})
export class UsersModule {}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { AuthenticationService } from './authentication.service';
import { LogoutComponent } from './logout/logout.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserlistComponent } from './userlist/userlist.component';
import { UserService } from './user.service';
import { EdituserComponent } from './edituser/edituser.component';
import { NotificationService } from './notification.service';
import { AlertComponent } from './alert/alert.component';
import { AddUserComponent } from './add-user/add-user.component';
import { RouterModule, Routes } from '@angular/router';

const APPROUTES: Routes = [
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    component: UserlistComponent
  },
  {
    path: 'create',
    component: AddUserComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LogoutComponent,
    NavbarComponent,
    UserlistComponent,
    EdituserComponent,
    AlertComponent,
    AddUserComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(APPROUTES, {
      enableTracing: true
    })
  ],
  providers: [
    AuthenticationService,
    NotificationService,
    UserService
  ],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [
    EdituserComponent
  ]
})
export class AppModule {
}

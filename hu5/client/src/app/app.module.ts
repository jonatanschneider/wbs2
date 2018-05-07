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
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from './authentication.guard';
import { LandingPageComponent } from './landing-page/landing-page.component';

const APPROUTES: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'users',
    canActivate: [AuthenticationGuard],
    component: UserlistComponent
  },
  {
    path: 'users/:id',
    canActivate: [AuthenticationGuard],
    component: UserlistComponent
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
    LandingPageComponent
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
    AuthenticationGuard,
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

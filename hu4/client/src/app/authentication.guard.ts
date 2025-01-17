import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs/Observable';
import { NotificationService } from './notification.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router){
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authenticationService.watchUser.map(user => {
      if(user) {
        return true;
      }  else {
        this.notificationService.warn('You are not authorized to view this page. Please log in');
        this.router.navigate(['/']);
        return false;
      }
    });
  }
}

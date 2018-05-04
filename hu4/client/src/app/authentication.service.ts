import { Injectable } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class AuthenticationService {
  user: BehaviorSubject<User> = new BehaviorSubject<User>(undefined);

  constructor(private httpClient: HttpClient) {
    this.isUserLoggedIn().subscribe(result => {
      if (result) {
        // TODO: add username here, not delivered by server
        this.user.next(new User());
      }
    })
  }

  login(username: string, password: string): Observable<boolean> {
    return this.httpClient.post('/apilogin', {
      username: username,
      password: password
    }, {observe: 'response'})
      .map(response => {
        if (response.status === 200) {
          this.user.next(new User(username));
          return true;
        } else {
          this.user.next(undefined);
          // ToDo: Use NotificaionService
          console.log('Error: ' + response.body);
        }
        return false;
      })
  }

  logout(): Observable<boolean> {

    return this.httpClient.post('/apilogout', {}, {observe: 'response'})
      .map(response => {
        if (response.status === 200) {
          this.user.next(undefined);
          return true;
        }
        return false;
      })
  }

  isUserLoggedIn(): Observable<boolean> {
    return this.httpClient.get('/apilogin/check', {observe: 'response'})
      .map(result => {
        return result.status === 200;
      })
  }

  get watchUser(): Observable<User> {
    return this.user.asObservable();
  }
}

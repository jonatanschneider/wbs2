import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { User } from './user';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService {

  constructor(private httpClient: HttpClient) {
  }

  getUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>("/users", {observe: 'response'})
      .map(result => {
        return result.body['users'];
      })
  }

  updateUser(user: User): Observable<boolean> {
    let body: object;

    if(user.password){
      body = {
        vorname: user.vorname,
        nachname: user.nachname,
        password: user.password
      }
    } else {
      body = {
        vorname: user.vorname,
        nachname: user.nachname
      }
    }
    return this.httpClient.put("/user/" + user.id, body)
      .map(result => {
        return result === 200;
      });
  }

  delete(user: User): Observable<boolean> {
    return this.httpClient.delete("/user/" + user.id)
      .map(result => {
        return result === 200;
      })
  }

}

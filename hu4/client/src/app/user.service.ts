import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { User } from './user';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService {

  constructor(private httpClient: HttpClient) {
  }

  getUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>("/apiusers", {observe: 'response'})
      .map(result => {
        return result.body['users'];
      })
  }

  addUser(user: User): Observable<boolean> {
    return this.httpClient.post("/apiuser", user, {observe: 'response'}).map(result => {
        return result.status === 201;
      });
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
    return this.httpClient.put("/apiuser/" + user.id, body, {observe: 'response'})
      .map(result => {
        return result.status === 201;
      });
  }

  delete(user: User): Observable<boolean> {
    return this.httpClient.delete("/apiuser/" + user.id, {observe: 'response'})
      .map(result => {
        return result.status === 200;
      })
  }

}

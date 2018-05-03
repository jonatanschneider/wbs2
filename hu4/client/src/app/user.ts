export class User {
  id: number;
  vorname: string;
  nachname: string;
  username : string;
  password: string;
  constructor(username?:string, id?:number, vorname?: string, nachname?: string, password?: string) {
    this.id = id;
    this.username = username;
    this.vorname = vorname;
    this.nachname = nachname;
    this.password = password;
  }
}

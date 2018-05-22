export class Alert {
  type: string;
  message: string;

  constructor(message: string, type: string) {
    this.type = type;
    this.message = message;
  }
}

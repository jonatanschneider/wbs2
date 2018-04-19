import {Component, OnInit} from '@angular/core';
import {ToDoEntry} from "../to-do-entry";

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  public todoList: ToDoEntry[] = [
    new ToDoEntry('Milch'),
    new ToDoEntry('Butter'),
    new ToDoEntry('Brot')
  ];

  constructor() {
  }

  done(index: number): void {
    this.todoList.splice(index, 1);
  }

  ngOnInit() {
  }

}

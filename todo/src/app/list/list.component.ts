import {Component, OnInit} from '@angular/core';
import {ToDoEntry} from "../to-do-entry";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AddTodoComponent} from "../add-todo/add-todo.component";

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

  constructor(private modalService: NgbModal) {
  }

  addToDoButtonClicked() {
    const modalReference = this.modalService.open(AddTodoComponent);
    modalReference.result
      .then((result: any) => {
        this.todoList.push(new ToDoEntry(result as string));
      })
      .catch((error) => {
        console.log('Window closed: ' + error);
      })
  }

  done(index: number): void {
    this.todoList.splice(index, 1);
  }

  ngOnInit() {
  }

}

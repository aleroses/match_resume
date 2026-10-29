import { Component, input } from '@angular/core';

@Component({
  selector: 'app-editor',
  template: '<h1>Editor</h1><p>{{ id() }}</p>',
})
export class EditorPage {
  readonly id = input.required<string>();
}

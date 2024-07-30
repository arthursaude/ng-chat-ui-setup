import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ChatService } from '../../supabase/chat.service';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private chatService = inject(ChatService);
  private dataService = inject(DataService);

  chatForm: FormGroup;

  chats = toSignal(this.dataService.getRealTimeChats());

  constructor() {
    this.chatForm = this.fb.group({
      chat_message: ['', Validators.required],
    });
  }

  async logOut() {
    await this.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  onSubmit() {
    const formValue = this.chatForm.value.chat_message;
    console.log('formValue', formValue);
    this.chatService
      .chatMessage(formValue)
      .then((data) => {
        this.chatForm.reset();
      })
      .catch((error) => {
        console.error('Error in chatMessage', error);
      });
  }
}

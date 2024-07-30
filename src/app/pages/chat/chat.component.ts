import { Component, effect, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Ichat } from '../../interface/chat-response';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../supabase/chat.service';
import { DatePipe } from '@angular/common';

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

  chatForm: FormGroup;

  chats = signal<Ichat[]>([]);

  constructor() {
    this.chatForm = this.fb.group({
      chat_message: ['', Validators.required],
    });

    effect(() => {
      this.onListChat();
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

  onListChat() {
    this.chatService
      .listChat()
      .then((data) => {
        if (data !== null) {
          this.chats.set(data as Ichat[]);
        } else {
          console.log('No data found');
        }
      })
      .catch((error) => {
        console.error('Error in listChat', error);
      });
  }
}

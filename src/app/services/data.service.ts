import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private supabase = inject(SupabaseService).supabase;

  constructor() {
    // this.supabase
    //   .channel('chat')
    //   .on(
    //     'postgres_changes',
    //     { event: 'UPDATE', schema: 'public', table: 'chat' },
    //     this.handleInserts
    //   )
    //   .subscribe();
  }

  getRealTimeChats(): Observable<any[]> {
    const chatData = new BehaviorSubject<any[]>([]);

    const handleUpdates = (payload: any) => {
      const newData = payload.new;
      const currentData = chatData.getValue();

      const updatedData = currentData.map((chat) =>
        chat.id === newData.id ? newData : chat
      );

      chatData.next(updatedData);
    };

    const handleInserts = (payload: any) => {
      const newData = payload.new;
      const currentData = chatData.getValue();

      const updatedData = [...currentData, newData];

      chatData.next(updatedData);
    };

    const handleDeletes = (payload: any) => {
      const deletedData = payload.old;
      const currentData = chatData.getValue();

      const updatedData = currentData.filter(
        (chat) => chat.id !== deletedData.id
      );

      chatData.next(updatedData);
    };

    this.listChat().then((data) => {
      chatData.next(data as any[]);

      this.supabase
        .channel('chat')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat' },
          handleUpdates
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat' },
          handleInserts
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'chat' },
          handleDeletes
        )
        .subscribe();
    });

    return chatData.asObservable();
  }

  listChat(): Promise<any[]> {
    // Implementação da função listChat que retorna a lista inicial de chats
    return this.supabase
      .from('chat')
      .select('*')
      .then((response) => response.data as any[]) as Promise<any[]>;
  }
}

import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, finalize, share } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private supabase = inject(SupabaseService).supabase;
  private channel: any;
  private printDebug = true;

  getRealTimeChats(): Signal<any[]> {
    const chatData = new BehaviorSubject<any[]>([]);

    const handleUpdates = (payload: any) => {
      const newData = payload.new;
      const currentData = chatData.getValue();

      const updatedData = currentData.map((chat) =>
        chat.id === newData.id ? newData : chat
      );

      if (this.printDebug) {
        console.log('handleUpdates', updatedData);
      }

      chatData.next(updatedData);
    };

    const handleInserts = (payload: any) => {
      const newData = payload.new;
      const currentData = chatData.getValue();

      const updatedData = [...currentData, newData];

      if (this.printDebug) {
        console.log('handleInserts', updatedData);
      }
      chatData.next(updatedData);
    };

    const handleDeletes = (payload: any) => {
      const deletedData = payload.old;
      const currentData = chatData.getValue();

      const updatedData = currentData.filter(
        (chat) => chat.id !== deletedData.id
      );

      if (this.printDebug) {
        console.log('handleDeletes', updatedData);
      }

      chatData.next(updatedData);
    };
    let dataChannel: RealtimeChannel;
    this.listChat().then((data) => {
      chatData.next(data as any[]);

      dataChannel = this.supabase
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

    const data$ = chatData.asObservable().pipe(
      finalize(() => {
        if (dataChannel) {
          dataChannel.unsubscribe();
        }
      }),
      share()
    );
    return toSignal(data$) as Signal<any[]>;
  }

  listChat(): Promise<any[]> {
    // Implementação da função listChat que retorna a lista inicial de chats
    return this.supabase
      .from('chat')
      .select('*')
      .then((response) => response.data as any[]) as Promise<any[]>;
  }

  unsubscribeRealTimeChats() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }
}

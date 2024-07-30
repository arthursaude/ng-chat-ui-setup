import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase = inject(SupabaseService).supabase;
  constructor() {
    const handleInserts = (payload: any) => {
      console.log('Change received!', payload);
    };

    this.supabase
      .channel('chat')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat' },
        handleInserts
      )
      .subscribe();
  }

  async chatMessage(text: string) {
    try {
      const { data, error } = await this.supabase.from('chat').insert({ text });

      if (error) {
        console.error('Error in chatMessage', error);
      }
      return data;
    } catch (error) {
      console.error('Error in chatMessage', error);
      return error;
    }
  }

  async listChat() {
    try {
      const { data, error } = await this.supabase
        .from('chat')
        .select('*,users(*)');

      if (error) {
        console.error('Error in listChat', error);
      }
      return data;
    } catch (error) {
      console.error('Error in listChat', error);
      return error;
    }
  }
}

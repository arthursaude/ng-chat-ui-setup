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
  private printDebug = true;

  getRealTimeData(table: string): Signal<any[]> {
    const data = new BehaviorSubject<any[]>([]);

    const handleUpdates = (payload: any) => {
      const newData = payload.new;
      const currentData = data.getValue();

      const updatedData = currentData.map((item) =>
        item.id === newData.id ? newData : item
      );

      if (this.printDebug) {
        console.log('handleUpdates', updatedData);
      }

      data.next(updatedData);
    };

    const handleInserts = (payload: any) => {
      const newData = payload.new;
      const currentData = data.getValue();

      const updatedData = [...currentData, newData];

      if (this.printDebug) {
        console.log('handleInserts', updatedData);
      }
      data.next(updatedData);
    };

    const handleDeletes = (payload: any) => {
      const deletedData = payload.old;
      const currentData = data.getValue();

      const updatedData = currentData.filter(
        (item) => item.id !== deletedData.id
      );

      if (this.printDebug) {
        console.log('handleDeletes', updatedData);
      }

      data.next(updatedData);
    };

    let dataChannel: RealtimeChannel;
    this.supabase
      .from(table)
      .select('*')
      .then((response) => {
        data.next(response.data as any[]);
        dataChannel = this.supabase
          .channel(table)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table },
            handleUpdates
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table },
            handleInserts
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table },
            handleDeletes
          )
          .subscribe();
      });

    const data$ = data.asObservable().pipe(
      finalize(() => {
        if (dataChannel) {
          dataChannel.unsubscribe();
        }
      }),
      share()
    );
    return toSignal(data$) as Signal<any[]>;
  }
}

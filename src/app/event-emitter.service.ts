import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventEmitterService {
  private resetEvent = new Subject<void>();

  emitResetEvent() {
    this.resetEvent.next();
  }

  getResetEvent() {
    return this.resetEvent.asObservable();
  }
}

import { Clock } from '../application/clock';

export class SystemClock extends Clock {
  override now(): string {
    return new Date().toISOString();
  }
}

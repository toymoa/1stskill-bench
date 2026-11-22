import { readLength } from './frame.mjs';
export class Decoder {
  constructor(max) {
    this.max = max;
    this.pending = Buffer.alloc(0);
    this.frames = [];
    this.closed = false;
    this.error = null;
    this.peak = 0;
  }
  push(chunk) {
    if (this.closed) throw new Error('CLOSED');
    let cursor = 0;
    while (cursor < chunk.length) {
      let need =
        this.pending.length < 4
          ? 4 - this.pending.length
          : 4 + readLength(this.pending, 0) - this.pending.length;
      const take = Math.min(need, chunk.length - cursor);
      this.pending = Buffer.concat([this.pending, chunk.subarray(cursor, cursor + take)]);
      cursor += take;
      this.peak = Math.max(this.peak, this.pending.length);
      if (this.pending.length < 4) continue;
      const length = readLength(this.pending, 0);
      if (length > this.max) {
        this.error = 'LIMIT';
        this.closed = true;
        return;
      }
      if (this.pending.length === 4 + length) {
        try {
          const text = new TextDecoder('utf-8', { fatal: true }).decode(this.pending.subarray(4));
          this.frames.push(JSON.parse(text));
        } catch {
          this.error = 'INVALID';
          this.closed = true;
          return;
        }
        this.pending = Buffer.alloc(0);
      }
    }
  }
  finish() {
    if (!this.closed) {
      this.closed = true;
      if (this.pending.length) this.error = 'TRUNCATED';
    }
    return this.error;
  }
  abort() {
    this.closed = true;
    this.pending = Buffer.alloc(0);
    this.error = 'ABORTED';
  }
}

import { Decoder } from './decoder.mjs';
export function channel(input) {
  const d = new Decoder(input.maxFrame),
    events = [],
    delivered = [];
  let queue = [],
    paused = false,
    terminal = false;
  const drain = () => {
    if (!paused) {
      delivered.push(...queue);
      queue = [];
    }
  };
  for (const op of input.operations) {
    if (terminal) {
      events.push('IGNORED');
      continue;
    }
    if (op.type === 'pause') {
      paused = true;
      events.push('PAUSED');
      continue;
    }
    if (op.type === 'resume') {
      paused = false;
      drain();
      events.push('RESUMED');
      continue;
    }
    if (op.type === 'abort') {
      d.abort();
      queue = [];
      terminal = true;
      events.push('ABORTED');
      continue;
    }
    if (op.type === 'end') {
      const error = d.finish();
      drain();
      terminal = true;
      events.push(error || 'END');
      continue;
    }
    if (op.type === 'push') {
      d.push(Buffer.from(op.hex, 'hex'));
      queue.push(...d.frames.splice(0));
      drain();
      if (queue.length > input.capacity) {
        queue = [];
        terminal = true;
        events.push('BACKPRESSURE');
        continue;
      }
      if (d.error) {
        terminal = true;
        events.push(d.error);
      } else events.push(queue.length === input.capacity && paused ? 'PAUSE_PRODUCER' : 'ACCEPTED');
    }
  }
  return { delivered, events, buffered: queue.length, terminal };
}

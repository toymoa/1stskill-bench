import { Scheduler } from './scheduler.mjs';
export async function handle(input) {
  const scheduler = new Scheduler(input);
  for (const op of input.operations) {
    if (op.type === 'submit') scheduler.submit(op.task);
    else if (op.type === 'advance') scheduler.advance(op.to);
    else if (op.type === 'cancel') scheduler.cancel(op.scope);
    else if (op.type === 'shutdown') scheduler.shutdown();
  }
  return scheduler.result();
}

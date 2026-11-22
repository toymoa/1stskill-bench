import { Replica } from './replica.mjs';
export async function handle(input) {
  const replica = new Replica(input.actors),
    results = [];
  for (const cmd of input.commands) {
    try {
      if (cmd.type === 'receive') {
        replica.receive(cmd.ops);
        results.push({ received: true });
      } else if (cmd.type === 'merge') {
        replica.merge(cmd.snapshot);
        results.push({ merged: true });
      } else if (cmd.type === 'compact')
        results.push({ compacted: replica.compact(cmd.clock, cmd.acks) });
      else if (cmd.type === 'snapshot') results.push(replica.snapshot());
    } catch (e) {
      results.push({ error: e.message });
    }
  }
  return { results, ...replica.result() };
}

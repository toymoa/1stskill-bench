import { deadline, belongs } from './scopes.mjs';
import { mayRetry, cancellationStatus } from './policy.mjs';
export class Scheduler {
  constructor(input) {
    this.scopes = new Map(input.scopes.map((s) => [s.id, s]));
    this.limit = input.limit;
    this.tasks = new Map();
    this.now = 0;
    this.order = 0;
    this.trace = [];
    this.closed = false;
    this.cancelled = new Set();
  }
  finish(t, state) {
    t.state = state;
    this.trace.push([this.now, t.id, state]);
  }
  submit(spec) {
    if (this.closed || [...this.cancelled].some((s) => belongs(this.scopes, spec.scope, s))) {
      this.trace.push([this.now, spec.id, 'rejected']);
      return;
    }
    const t = {
      ...spec,
      deadline: deadline(this.scopes, spec.scope, spec.deadline),
      state: 'queued',
      ready: this.now,
      attempt: 0,
      ordinal: ++this.order,
    };
    this.tasks.set(t.id, t);
    this.settle();
  }
  settle() {
    for (const t of this.tasks.values())
      if (['queued', 'running', 'backoff'].includes(t.state) && cancellationStatus(t, this.now))
        this.finish(t, 'timed_out');
    for (const t of this.tasks.values())
      if (t.state === 'running' && t.end <= this.now) {
        if (t.attempt <= t.failures) {
          if (mayRetry(t)) {
            t.state = 'backoff';
            t.ready = this.now + t.backoff;
            t.ordinal = ++this.order;
            this.trace.push([this.now, t.id, 'retry', t.ready]);
          } else this.finish(t, 'failed');
        } else this.finish(t, 'done');
      }
    for (const t of this.tasks.values())
      if (t.state === 'backoff' && t.ready <= this.now) t.state = 'queued';
    let active = [...this.tasks.values()].filter((t) => t.state === 'running').length;
    for (const t of [...this.tasks.values()]
      .filter((t) => t.state === 'queued')
      .sort((a, b) => a.ordinal - b.ordinal)) {
      if (active >= this.limit) break;
      t.state = 'running';
      t.attempt++;
      t.end = this.now + t.durations[Math.min(t.attempt - 1, t.durations.length - 1)];
      this.trace.push([this.now, t.id, 'start', t.attempt]);
      active++;
    }
  }
  advance(to) {
    while (this.now < to) {
      const times = [to];
      for (const t of this.tasks.values()) {
        if (['queued', 'running', 'backoff'].includes(t.state) && t.deadline > this.now)
          times.push(t.deadline);
        if (t.state === 'running' && t.end > this.now) times.push(t.end);
        if (t.state === 'backoff' && t.ready > this.now) times.push(t.ready);
      }
      this.now = Math.min(...times);
      this.settle();
    }
  }
  cancel(scope) {
    this.cancelled.add(scope);
    for (const t of this.tasks.values())
      if (
        ['queued', 'running', 'backoff'].includes(t.state) &&
        belongs(this.scopes, t.scope, scope)
      )
        this.finish(t, 'cancelled');
    this.settle();
  }
  shutdown() {
    this.closed = true;
    for (const t of this.tasks.values())
      if (['queued', 'running', 'backoff'].includes(t.state)) this.finish(t, 'cancelled');
  }
  result() {
    return {
      trace: this.trace,
      tasks: Object.fromEntries(
        [...this.tasks].map(([id, t]) => [id, { state: t.state, attempts: t.attempt }]),
      ),
      active: [...this.tasks.values()].filter((t) => t.state === 'running').length,
      closed: this.closed,
    };
  }
}

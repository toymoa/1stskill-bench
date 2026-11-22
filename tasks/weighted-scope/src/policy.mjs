export function mayRetry(task) {
  return task.attempt < task.maxAttempts;
}
export function cancellationStatus(task, now) {
  return now >= task.deadline ? 'timed_out' : null;
}

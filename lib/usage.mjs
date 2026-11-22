// Mirrors parseUsage in 1stskill src/scoring.js.
const validTokens = (n) => Number.isSafeInteger(n) && n >= 0;
export function parseUsage(cli, stdout) {
  if (!['codex', 'claude'].includes(cli)) return { inputTokens: null, outputTokens: null };
  const events = stdout.split('\n').flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
  if (cli === 'codex') {
    const usage = events.filter((e) => e.type === 'turn.completed' && e.usage).map((e) => e.usage);
    if (
      !usage.length ||
      usage.some((u) => !validTokens(u.input_tokens) || !validTokens(u.output_tokens))
    )
      return { inputTokens: null, outputTokens: null };
    return {
      inputTokens: usage.reduce((s, u) => s + u.input_tokens, 0),
      outputTokens: usage.reduce((s, u) => s + u.output_tokens, 0),
    };
  }
  const result = events.findLast((e) => e.type === 'result');
  const u = result?.usage;
  if (
    !u ||
    !validTokens(u.input_tokens) ||
    !validTokens(u.output_tokens) ||
    !validTokens(u.cache_read_input_tokens ?? 0) ||
    !validTokens(u.cache_creation_input_tokens ?? 0)
  )
    return { inputTokens: null, outputTokens: null };
  return {
    inputTokens:
      u.input_tokens + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
    outputTokens: u.output_tokens,
  };
}

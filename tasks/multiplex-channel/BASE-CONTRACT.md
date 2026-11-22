# Chunking, malformed payloads and channel lifecycle

Users report duplicated messages after a pause/resume and a permanently stuck producer after cancellation. Repair the framed decoder and channel state machine.

Wire format: 4-byte unsigned big-endian payload length followed by that many UTF-8 bytes containing exactly one JSON value (null/scalars allowed). maxFrame bounds payload bytes. Arbitrary chunk boundaries, concatenated frames and zero-length chunks are legal. Invalid UTF-8 or JSON produces INVALID; oversized declared length produces LIMIT as soon as its header is complete; EOF with any incomplete frame is TRUNCATED. Decoder storage must process incrementally, not buffer the entire stream. A zero-length payload is invalid JSON.

Input operations: push(hex), pause, resume, abort, end. Start unpaused. Each push decodes complete frames in order; unpaused messages are delivered immediately and removed from the queue. Paused capacity is a maximum count of complete queued frames. Exactly capacity means PAUSE_PRODUCER; exceeding it means BACKPRESSURE, discards the queue and terminates. Malformed pushes retain complete valid frames decoded before the error, delivered if unpaused. Abort discards incomplete and queued data, returns ABORTED and terminates. End drains if unpaused, leaves paused complete frames queued, and terminates with END/TRUNCATED. After terminal, every operation is IGNORED. Response shape and event labels are defined by channel.mjs. Completed messages must never be delivered twice.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.

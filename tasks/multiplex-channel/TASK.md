# Multiplexed streaming with independent channel lifecycle

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add input mode:'multiplex'. Legacy mode is unchanged. Each new wire frame is a 4-byte big-endian length followed by a 2-byte unsigned channel ID, 1-byte opcode and payload. Length includes these three control bytes and is bounded by maxFrame; values below 3 are INVALID. Opcode 0 is strict UTF-8 JSON data, opcode 1 is a channel close with no payload, other opcodes are INVALID. Data after close is CLOSED_CHANNEL and terminates the connection. Duplicate close is idempotent.

Operations push(hex), pause(channel), resume(channel), abort, end retain their legacy event labels. Pausing one channel must not stop delivery on other channels. Delivered entries are {channel,value}. A resume drains that channel in its arrival order, including a closed channel's queued messages. capacity applies per paused channel. A queue exactly at capacity produces PAUSE_PRODUCER; exceeding it produces BACKPRESSURE, discards ALL queued messages and terminates. A push may contain multiple channels and arbitrary split headers/multibyte payloads.

Complete valid messages before malformed data are retained/delivered as appropriate. Abort clears incomplete/queued data and terminates. End is END if framing is complete, otherwise TRUNCATED; paused complete queues remain visible in buffered count. Operations after terminal yield IGNORED. Return {delivered,events,buffered,terminal,closedChannels:[sorted numeric IDs]}. Memory for incomplete framing must be bounded by maxFrame+4, independent of total input length.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.

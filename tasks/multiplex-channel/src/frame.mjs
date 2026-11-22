export function readLength(bytes, offset) {
  if (bytes.length - offset < 4) return null;
  return bytes.readUInt32BE(offset);
}
export function frame(text) {
  const body = Buffer.from(text),
    header = Buffer.alloc(4);
  header.writeUInt32BE(body.length);
  return Buffer.concat([header, body]);
}

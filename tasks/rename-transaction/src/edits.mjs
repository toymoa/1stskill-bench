export function applyEdits(text, edits, newName) {
  let end = text.length;
  for (const edit of [...edits].sort((a, b) => b.textSpan.start - a.textSpan.start)) {
    const { start, length } = edit.textSpan;
    if (start + length > end) throw new Error('OVERLAP');
    text =
      text.slice(0, start) +
      (edit.prefixText || '') +
      newName +
      (edit.suffixText || '') +
      text.slice(start + length);
    end = start;
  }
  return text;
}

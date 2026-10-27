export function cleanName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s"'“”«»]+|[\s"'“”«»]+$/g, "")
    .trim();
}

export function fold(value: string) {
  return cleanName(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return fold(value).replace(/ /g, "-");
}

export function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length];
}

export function normalizedLevenshtein(left: string, right: string) {
  const max = Math.max(left.length, right.length);
  if (max === 0) return 0;
  return levenshtein(left, right) / max;
}

export function includesPhrase(haystack: string, needle: string) {
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(haystack);
}

export function publicationLinks(text) {
  const parts = [];
  let offset = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s<>]+/g)) {
    let url = match[0].replace(/[.,!?;:]+$/, '');
    while (url.endsWith(')') && url.split(')').length > url.split('(').length) {
      url = url.slice(0, -1);
    }
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    parts.push({ text: url, href: url });
    offset = match.index + url.length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}

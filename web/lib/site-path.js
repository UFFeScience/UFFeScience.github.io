export function assetPath(value) {
  return value?.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${value}` : value;
}
export function homePath(anchor = '') {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${anchor}`;
}

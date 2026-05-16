export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'anonymous';
}

export function extFromFilename(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === filename.length - 1) return 'bin';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function cleanFilename(name: string): string {
  return name.replace(/[\\/]/g, '_').slice(0, 200);
}

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

export function isMediaMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.toLowerCase().startsWith(p));
}

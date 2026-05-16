export interface GalleryItem {
  id: string;
  uploader: string;
  filename: string;
  mimetype: string;
  sizeBytes: number;
  uploadedAt: number;
  viewUrl: string;
}

export interface Comment {
  id: string;
  name: string;
  body: string;
  createdAt: number;
}

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let detail = '';
    try { detail = ((await res.json()) as { error?: string }).error || ''; } catch { /* */ }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const fetchGallery = () => http<{ items: GalleryItem[] }>('/api/gallery');

export const deleteItem = (id: string, adminKey: string) =>
  http<{ ok: true }>(`/api/admin/item/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });

export const adminZipUrl = (key: string) =>
  `/api/admin/zip?key=${encodeURIComponent(key)}`;

export const fetchReactions = (uploadId: string) =>
  http<{ counts: Record<string, number> }>(`/api/reactions/${uploadId}`);

export const addReaction = (uploadId: string, emoji: string) =>
  http<{ counts: Record<string, number> }>('/api/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, emoji }),
  });

export const fetchComments = (uploadId: string) =>
  http<{ comments: Comment[] }>(`/api/comments/${uploadId}`);

export const addComment = (uploadId: string, name: string, body: string) =>
  http<{ comment: Comment }>('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, name, body }),
  });

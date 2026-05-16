import { Env, json } from '../index';

interface Row {
  id: string;
  uploader: string;
  filename: string;
  object_key: string;
  mimetype: string;
  size_bytes: number;
  uploaded_at: number;
}

export async function handleGallery(_request: Request, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT id, uploader, filename, object_key, mimetype, size_bytes, uploaded_at
     FROM uploads
     WHERE status = 'ready'
     ORDER BY uploaded_at DESC`,
  ).all<Row>();

  const items = (result.results || []).map((row) => ({
    id: row.id,
    uploader: row.uploader,
    filename: row.filename,
    mimetype: row.mimetype,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    viewUrl: `/api/media/${encodeURIComponent(row.object_key)}`,
  }));

  return json({ items }, {}, env);
}

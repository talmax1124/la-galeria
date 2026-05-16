import { Env, err, json } from '../index';
import { cleanFilename, extFromFilename, isMediaMime, slugify, uuid } from '../util';

const MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || '';
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  const uploaderName = (request.headers.get('X-Uploader-Name') || '').trim();
  const originalFilename = (request.headers.get('X-Original-Filename') || 'upload').trim();

  if (!uploaderName) return err('X-Uploader-Name header is required', 400, env);
  if (!contentType || !isMediaMime(contentType)) {
    return err('Content-Type must be image/* or video/*', 400, env);
  }
  if (contentLength > MAX_SIZE_BYTES) return err('File exceeds 5 GB limit', 413, env);
  if (!request.body) return err('No body', 400, env);

  const filename = cleanFilename(originalFilename);
  const id = uuid();
  const ext = extFromFilename(filename);
  const objectKey = `uploads/${slugify(uploaderName)}/${id}.${ext}`;
  const size = contentLength || 0;

  // Stream body directly to R2 — no memory buffering for large files.
  await env.BUCKET.put(objectKey, request.body, {
    httpMetadata: { contentType },
    customMetadata: { uploader: uploaderName, filename },
  });

  // Record in D1.
  await env.DB.prepare(
    `INSERT INTO uploads (id, uploader, filename, object_key, mimetype, size_bytes, uploaded_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')`,
  )
    .bind(id, uploaderName, filename, objectKey, contentType, size, Date.now())
    .run();

  return json({ id, objectKey }, {}, env);
}

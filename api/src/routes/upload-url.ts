import { Env, err, json } from '../index';
import { presignPut } from '../r2';
import { cleanFilename, extFromFilename, isMediaMime, slugify, uuid } from '../util';

const MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB — R2 single-PUT cap

interface Body {
  name?: string;
  filename?: string;
  contentType?: string;
  size?: number;
}

export async function handleUploadUrl(request: Request, env: Env): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return err('Invalid JSON', 400, env);
  }

  const name = (body.name || '').trim();
  const filename = cleanFilename((body.filename || '').trim());
  const contentType = (body.contentType || '').trim();
  const size = Number(body.size);

  if (!name) return err('name is required', 400, env);
  if (!filename) return err('filename is required', 400, env);
  if (!contentType || !isMediaMime(contentType)) {
    return err('contentType must be image/* or video/*', 400, env);
  }
  if (!Number.isFinite(size) || size <= 0) return err('size must be a positive number', 400, env);
  if (size > MAX_SIZE_BYTES) return err('file exceeds 5GB limit', 413, env);

  const id = uuid();
  const ext = extFromFilename(filename);
  const objectKey = `uploads/${slugify(name)}/${id}.${ext}`;

  // Pre-insert a pending row so we can match by id during finalize.
  await env.DB.prepare(
    `INSERT INTO uploads (id, uploader, filename, object_key, mimetype, size_bytes, uploaded_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
  )
    .bind(id, name, filename, objectKey, contentType, size, Date.now())
    .run();

  const presignedPutUrl = await presignPut(env, objectKey, contentType, 3600);

  return json({ id, objectKey, presignedPutUrl }, {}, env);
}

import { Env, err, json } from '../index';
import { uuid } from '../util';

interface CommentRow { id: string; name: string; body: string; created_at: number }

export async function handleGetComments(uploadId: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, name, body, created_at FROM comments WHERE upload_id = ? ORDER BY created_at ASC`,
  ).bind(uploadId).all<CommentRow>();

  const comments = (rows.results || []).map((r) => ({
    id: r.id, name: r.name, body: r.body, createdAt: r.created_at,
  }));
  return json({ comments }, {}, env);
}

export async function handleAddComment(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { uploadId?: string; name?: string; body?: string };
  const uploadId = (body.uploadId || '').trim();
  const name = (body.name || '').trim().slice(0, 60);
  const text = (body.body || '').trim().slice(0, 500);

  if (!uploadId) return err('uploadId required', 400, env);
  if (!name) return err('name required', 400, env);
  if (!text) return err('body required', 400, env);

  const upload = await env.DB.prepare(`SELECT id FROM uploads WHERE id = ?`).bind(uploadId).first();
  if (!upload) return err('upload not found', 404, env);

  const id = uuid();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO comments (id, upload_id, name, body, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).bind(id, uploadId, name, text, now).run();

  return json({ comment: { id, name, body: text, createdAt: now } }, {}, env);
}

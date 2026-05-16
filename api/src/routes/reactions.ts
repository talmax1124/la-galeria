import { Env, err, json } from '../index';
import { uuid } from '../util';

const ALLOWED_EMOJIS = new Set(['❤️', '😂', '😮', '👏', '🔥']);

interface CountRow { emoji: string; count: number }

export async function handleGetReactions(uploadId: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT emoji, COUNT(*) as count FROM reactions WHERE upload_id = ? GROUP BY emoji`,
  ).bind(uploadId).all<CountRow>();

  const counts: Record<string, number> = {};
  for (const r of rows.results || []) counts[r.emoji] = r.count;
  return json({ counts }, {}, env);
}

export async function handleAddReaction(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { uploadId?: string; emoji?: string };
  const uploadId = (body.uploadId || '').trim();
  const emoji = (body.emoji || '').trim();

  if (!uploadId) return err('uploadId required', 400, env);
  if (!ALLOWED_EMOJIS.has(emoji)) return err('emoji not allowed', 400, env);

  const upload = await env.DB.prepare(`SELECT id FROM uploads WHERE id = ?`).bind(uploadId).first();
  if (!upload) return err('upload not found', 404, env);

  await env.DB.prepare(
    `INSERT INTO reactions (id, upload_id, emoji, created_at) VALUES (?, ?, ?, ?)`,
  ).bind(uuid(), uploadId, emoji, Date.now()).run();

  const rows = await env.DB.prepare(
    `SELECT emoji, COUNT(*) as count FROM reactions WHERE upload_id = ? GROUP BY emoji`,
  ).bind(uploadId).all<CountRow>();

  const counts: Record<string, number> = {};
  for (const r of rows.results || []) counts[r.emoji] = r.count;
  return json({ counts }, {}, env);
}

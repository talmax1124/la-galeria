import { Env, err, json } from '../index';

interface Body {
  id?: string;
}

export async function handleFinalize(request: Request, env: Env): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return err('Invalid JSON', 400, env);
  }
  const id = (body.id || '').trim();
  if (!id) return err('id is required', 400, env);

  const row = await env.DB.prepare(
    `SELECT object_key FROM uploads WHERE id = ?`,
  )
    .bind(id)
    .first<{ object_key: string }>();

  if (!row) return err('Unknown upload id', 404, env);

  // Verify the object actually landed in R2 before flipping status.
  const head = await env.BUCKET.head(row.object_key);
  if (!head) return err('Object not found in storage', 409, env);

  await env.DB.prepare(`UPDATE uploads SET status = 'ready' WHERE id = ?`).bind(id).run();

  return json({ ok: true }, {}, env);
}

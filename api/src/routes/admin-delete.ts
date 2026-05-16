import { Env, err, json } from '../index';
import { isAdmin } from '../auth';

export async function handleAdminDelete(
  id: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isAdmin(request, env)) return err('Unauthorized', 401, env);
  if (!id) return err('id is required', 400, env);

  const row = await env.DB.prepare(`SELECT object_key FROM uploads WHERE id = ?`)
    .bind(id)
    .first<{ object_key: string }>();

  if (!row) return err('Not found', 404, env);

  await env.BUCKET.delete(row.object_key);
  await env.DB.prepare(`DELETE FROM uploads WHERE id = ?`).bind(id).run();

  return json({ ok: true }, {}, env);
}

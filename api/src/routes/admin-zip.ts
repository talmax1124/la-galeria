import { downloadZip } from 'client-zip';
import { Env, err } from '../index';
import { isAdmin } from '../auth';

interface Row {
  uploader: string;
  filename: string;
  object_key: string;
  uploaded_at: number;
}

export async function handleAdminZip(request: Request, env: Env): Promise<Response> {
  if (!isAdmin(request, env)) return err('Unauthorized', 401, env);

  const result = await env.DB.prepare(
    `SELECT uploader, filename, object_key, uploaded_at
     FROM uploads
     WHERE status = 'ready'
     ORDER BY uploader, uploaded_at`,
  ).all<Row>();

  const rows = result.results || [];
  const seen = new Map<string, number>();

  async function* iterEntries() {
    for (const row of rows) {
      const obj = await env.BUCKET.get(row.object_key);
      if (!obj) continue;
      const folder = sanitizeFolder(row.uploader);
      const file = uniqueName(seen, folder, row.filename, row.object_key);
      yield {
        name: `${folder}/${file}`,
        lastModified: new Date(row.uploaded_at),
        input: obj.body as ReadableStream<Uint8Array>,
      };
    }
  }

  const zipResponse = downloadZip(iterEntries());
  const filename = `la-galeria-${new Date().toISOString().slice(0, 10)}.zip`;

  return new Response(zipResponse.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    },
  });
}

function sanitizeFolder(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 60) || 'anonymous';
}

function uniqueName(
  seen: Map<string, number>,
  folder: string,
  filename: string,
  fallbackKey: string,
): string {
  const safe =
    filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 200) || fallbackKey.split('/').pop() || 'file';
  const k = `${folder}/${safe}`;
  const n = (seen.get(k) || 0) + 1;
  seen.set(k, n);
  if (n === 1) return safe;
  const dot = safe.lastIndexOf('.');
  if (dot === -1) return `${safe}-${n}`;
  return `${safe.slice(0, dot)}-${n}${safe.slice(dot)}`;
}

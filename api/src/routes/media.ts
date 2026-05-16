import { Env, err } from '../index';

export async function handleMedia(objectKey: string, env: Env): Promise<Response> {
  if (!objectKey) return err('Not found', 404, env);

  const obj = await env.BUCKET.get(objectKey);
  if (!obj) return err('Not found', 404, env);

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  if (obj.httpMetadata?.contentType) {
    headers.set('Content-Type', obj.httpMetadata.contentType);
  }
  if (obj.size) {
    headers.set('Content-Length', String(obj.size));
  }

  return new Response(obj.body as ReadableStream, { headers });
}

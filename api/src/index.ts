import { handleUpload } from './routes/upload';
import { handleMedia } from './routes/media';
import { handleGallery } from './routes/gallery';
import { handleAdminZip } from './routes/admin-zip';
import { handleAdminDelete } from './routes/admin-delete';
import { handleGetReactions, handleAddReaction } from './routes/reactions';
import { handleGetComments, handleAddComment } from './routes/comments';

export interface Env {
  BUCKET: R2Bucket;
  DB: D1Database;
  ADMIN_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  ALLOWED_ORIGIN: string;
  PUBLIC_BASE_URL: string;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Admin-Key, X-Uploader-Name, X-Original-Filename, Content-Length',
    'Access-Control-Max-Age': '86400',
  };
}

export function json(body: unknown, init: ResponseInit = {}, env?: Env): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(env ? corsHeaders(env) : {}),
      ...(init.headers || {}),
    },
  });
}

export function err(message: string, status: number, env?: Env): Response {
  return json({ error: message }, { status }, env);
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    try {
      // Upload
      if (path === '/api/upload' && method === 'POST') return handleUpload(request, env);

      // Media proxy
      if (path.startsWith('/api/media/') && method === 'GET') {
        const objectKey = decodeURIComponent(path.replace('/api/media/', ''));
        return handleMedia(objectKey, env);
      }

      // Gallery
      if (path === '/api/gallery' && method === 'GET') return handleGallery(request, env);

      // Reactions
      if (path.startsWith('/api/reactions/') && method === 'GET') {
        const uploadId = path.replace('/api/reactions/', '');
        return handleGetReactions(uploadId, env);
      }
      if (path === '/api/reactions' && method === 'POST') return handleAddReaction(request, env);

      // Comments
      if (path.startsWith('/api/comments/') && method === 'GET') {
        const uploadId = path.replace('/api/comments/', '');
        return handleGetComments(uploadId, env);
      }
      if (path === '/api/comments' && method === 'POST') return handleAddComment(request, env);

      // Admin
      if (path === '/api/admin/zip' && method === 'GET') return handleAdminZip(request, env);
      if (path.startsWith('/api/admin/item/') && method === 'DELETE') {
        const id = path.replace('/api/admin/item/', '');
        return handleAdminDelete(id, request, env);
      }

      if (path === '/api/health' && method === 'GET') return json({ ok: true }, {}, env);

      return err('Not found', 404, env);
    } catch (e) {
      console.error('Worker error:', e);
      return err(e instanceof Error ? e.message : 'Unknown error', 500, env);
    }
  },
};

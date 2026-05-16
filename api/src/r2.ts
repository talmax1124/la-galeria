import { AwsClient } from 'aws4fetch';
import type { Env } from './index';

function client(env: Env): AwsClient {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });
}

function endpoint(env: Env): string {
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

const BUCKET_NAME = 'la-galeria';

export async function presignPut(
  env: Env,
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const url = `${endpoint(env)}/${BUCKET_NAME}/${encodeKey(key)}?X-Amz-Expires=${expiresIn}`;
  const signed = await client(env).sign(
    new Request(url, { method: 'PUT', headers: { 'Content-Type': contentType } }),
    { aws: { signQuery: true } },
  );
  return signed.url;
}

export async function presignGet(env: Env, key: string, expiresIn = 86400): Promise<string> {
  const url = `${endpoint(env)}/${BUCKET_NAME}/${encodeKey(key)}?X-Amz-Expires=${expiresIn}`;
  const signed = await client(env).sign(new Request(url, { method: 'GET' }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

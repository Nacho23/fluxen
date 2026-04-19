import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { randomUUID } from "node:crypto";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

function getBucket(): string {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error("R2_BUCKET_NAME no configurado");
  return b;
}

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Almacenamiento R2 no configurado");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").trim() || "archivo";
  return base.replace(/[^\w.\- ()\u00C0-\u024F]+/g, "_").slice(0, 180);
}

export function buildObjectKey(companyId: string, originalFilename: string): string {
  const safe = sanitizeFilename(originalFilename);
  return `companies/${companyId}/${randomUUID()}/${safe}`;
}

export function assertKeyBelongsToCompany(key: string, companyId: string): void {
  const prefix = `companies/${companyId}/`;
  if (!key.startsWith(prefix)) {
    throw new Error("Clave de archivo inválida");
  }
}

export { MAX_UPLOAD_BYTES };

export async function presignGetObject(key: string, downloadFilename: string): Promise<string> {
  const client = getClient();
  const safeName = sanitizeFilename(downloadFilename);
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
  });
  return getSignedUrl(client, cmd, { expiresIn: 300 });
}

export async function headObjectMeta(key: string): Promise<{ contentLength: number; contentType: string }> {
  const client = getClient();
  const out = await client.send(
    new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
  const len = out.ContentLength;
  if (len == null || len < 1) {
    throw new Error("No se pudo validar el archivo subido");
  }
  if (len > MAX_UPLOAD_BYTES) {
    throw new Error("El archivo subido supera el tamaño permitido");
  }
  const ct = out.ContentType?.trim() || "application/octet-stream";
  return { contentLength: len, contentType: ct };
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

/** Subida desde el servidor (evita CORS del PUT directo al bucket desde el navegador). */
export async function putObjectBytes(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  if (body.length > MAX_UPLOAD_BYTES) {
    throw new Error(`El archivo supera el máximo de ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`);
  }
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

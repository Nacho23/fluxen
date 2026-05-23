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

/** Imágenes de marca (portada / avatar): límite por archivo. */
export const MAX_BRANDING_IMAGE_BYTES = 5 * 1024 * 1024;

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

const BRANDING_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function brandingExtensionLower(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "");
  const i = base.lastIndexOf(".");
  if (i < 0) return ".jpg";
  const ext = base.slice(i).toLowerCase();
  return BRANDING_EXT.has(ext) ? ext : ".jpg";
}

export function buildBrandingObjectKey(
  companyId: string,
  kind: "cover" | "avatar" | "logo",
  originalFilename: string,
): string {
  const ext = brandingExtensionLower(originalFilename);
  return `companies/${companyId}/branding/${kind}-${randomUUID()}${ext}`;
}

export function assertBrandingKeyBelongsToCompany(key: string, companyId: string): void {
  const prefix = `companies/${companyId}/branding/`;
  if (!key.startsWith(prefix)) {
    throw new Error("Clave de imagen de marca inválida");
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

/** URL firmada para mostrar imagen en el navegador (sin forzar descarga). */
export async function presignGetObjectInline(
  key: string,
  contentType: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const client = getClient();
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentType: contentType,
    ResponseContentDisposition: "inline",
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

/** Lee el objeto completo (p. ej. logo para incrustar en PDF). */
export async function getObjectBytes(key: string): Promise<{ body: Buffer; contentType: string }> {
  const client = getClient();
  const out = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
  const stream = out.Body;
  if (!stream) {
    throw new Error("Objeto vacío");
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  const contentType = out.ContentType?.trim() || "application/octet-stream";
  return { body, contentType };
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

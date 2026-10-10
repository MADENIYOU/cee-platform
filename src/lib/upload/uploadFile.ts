import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { validateUploadedFile, type ValidationResult } from "@/lib/upload/validators";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export type UploadFileOptions = {
  allowedTypes: string[];
  maxSizeBytes?: Record<string, number>;
};

export type UploadFileResult = {
  url: string;
  key: string;
  sizeBytes: number;
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Utilitaire d'upload partagé — contrat exposé aux modules 2 et 4
 * (pièces jointes d'annonces, médias de posts). Toujours exécuté côté
 * serveur, jamais sur le thread de rendu (règle d'ingénierie n°5).
 */
export async function uploadFile(
  file: File,
  options: UploadFileOptions
): Promise<UploadFileResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const validation: ValidationResult = await validateUploadedFile(buffer, options);
  if (!validation.valid) {
    throw new UploadValidationError(validation.reason);
  }

  const extension = validation.mimeType.split("/")[1] ?? "bin";
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: validation.mimeType,
    })
  );

  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  const url = publicDomain ? `${publicDomain}/${key}` : key;

  return { url, key, sizeBytes: buffer.byteLength };
}

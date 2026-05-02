import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl as presignGetObject } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

import { env } from "@/env";

let client: S3Client | null = null;

function assertR2Configured(): {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
} {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT } =
    env;
  if (
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_ENDPOINT
  ) {
    throw new Error(
      "R2 storage is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT."
    );
  }
  return {
    bucket: R2_BUCKET_NAME,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    endpoint: R2_ENDPOINT,
  };
}

function getClient(): S3Client {
  const cfg = assertR2Configured();
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

export type UploadBody = Buffer | Uint8Array | Readable;

/**
 * Upload bytes or a stream to R2. Caller supplies a unique object key.
 */
export async function uploadFile(
  key: string,
  body: UploadBody,
  contentType: string
): Promise<void> {
  const { bucket } = assertR2Configured();
  const s3 = getClient();

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  await upload.done();
}

export async function deleteFile(key: string): Promise<void> {
  const { bucket } = assertR2Configured();
  const s3 = getClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Presigned GET URL for an existing object. Expires after `expirySeconds`.
 */
export async function getSignedUrl(
  key: string,
  expirySeconds: number
): Promise<string> {
  const { bucket } = assertR2Configured();
  const s3 = getClient();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return presignGetObject(s3, command, { expiresIn: expirySeconds });
}

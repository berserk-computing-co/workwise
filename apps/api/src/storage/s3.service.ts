import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3File {
  body: ReadableStream | NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
}

export interface S3ObjectInfo {
  key: string;
  size?: number;
  lastModified?: Date;
}

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET_NAME");
    this.client = new S3Client({
      region: config.get<string>("AWS_REGION", "us-east-1"),
    });
  }

  /** Get a file's contents from S3. */
  async getObject(key: string): Promise<S3File> {
    const res: GetObjectCommandOutput = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!res.Body) {
      throw new Error(`S3 returned no body for key: ${key}`);
    }

    return {
      body: res.Body as ReadableStream,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
    };
  }

  /** Get a file as a base64 string — ready for Anthropic image/document content blocks. */
  async getObjectAsBase64(key: string): Promise<{ base64: string; contentType: string }> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!res.Body) {
      throw new Error(`S3 returned no body for key: ${key}`);
    }

    const bytes = await res.Body.transformToByteArray();
    return {
      base64: Buffer.from(bytes).toString("base64"),
      contentType: res.ContentType ?? "application/octet-stream",
    };
  }

  /** Check whether a key exists. */
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "NotFound"
      ) {
        return false;
      }
      throw err;
    }
  }

  /** List objects under a prefix. */
  async listObjects(
    prefix: string,
    maxKeys = 1000,
  ): Promise<S3ObjectInfo[]> {
    const res = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      }),
    );

    return (res.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
  }

  /** Delete an object. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * Generate a presigned PUT URL for client-side uploads.
   * @param key         S3 object key
   * @param contentType MIME type for the upload
   * @param expiresIn   Seconds until the URL expires (default 900 = 15 min)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generate a presigned GET URL for client-side downloads.
   * @param key        S3 object key
   * @param expiresIn  Seconds until the URL expires (default 900 = 15 min)
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}

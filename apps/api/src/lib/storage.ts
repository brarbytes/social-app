// TODO: Implement with AWS SDK v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const placeholderUrl = `https://storage.placeholder.local/${key}`;
  return placeholderUrl;
}

export async function getSignedUrl(key: string): Promise<string> {
  const placeholderUrl = `https://storage.placeholder.local/${key}?signed=true`;
  return placeholderUrl;
}

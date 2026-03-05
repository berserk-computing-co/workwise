export interface UploadedFileInfo {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Accepted: JPEG, PNG, WebP, HEIC.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB.`;
  }
  return null;
}

async function registerFile(
  projectId: string,
  file: File,
): Promise<{ id: string; uploadUrl: string }> {
  const res = await fetch("/api/proxy/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || "Failed to register file",
    );
  }
  return res.json();
}

async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error("Failed to upload file to storage");
  }
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
): Promise<UploadedFileInfo> {
  const { id, uploadUrl } = await registerFile(projectId, file);
  await uploadToS3(uploadUrl, file);
  return {
    id,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  };
}

export async function deleteProjectFile(fileId: string): Promise<void> {
  const res = await fetch(`/api/proxy/files/${fileId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to delete file");
  }
}

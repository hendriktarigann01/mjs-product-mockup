const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

/**
 * Upload base64 PNG data URL ke Cloudinary (unsigned preset).
 * @param dataUrl - base64 PNG data URL dari canvas.toDataURL()
 * @param folder  - folder di Cloudinary (e.g. "happify/designs")
 * @returns Cloudinary upload result (secure_url)
 */
export async function uploadToCloudinary(
  dataUrl: string,
  folder: string = "happify/designs",
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary env vars not configured");
  }

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Cloudinary upload failed: ${res.status}`);
  }

  return res.json();
}

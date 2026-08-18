export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in environment variables.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Dev-Journal");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary.");
  }

  const data = await response.json();
  
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

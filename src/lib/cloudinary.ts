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

/**
 * Extracts the public_id from a Cloudinary URL and calls the backend API route to delete it.
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    // A standard Cloudinary URL looks like:
    // https://res.cloudinary.com/cloudname/image/upload/v123456789/folder/image.jpg
    // We want to extract "folder/image" (without the extension)
    const urlParts = imageUrl.split("/");
    const filenameWithExt = urlParts[urlParts.length - 1];
    const filename = filenameWithExt.split(".")[0];
    
    // Check if there is a folder (if the URL has more than 7 parts, assuming standard structure)
    // upload_preset "Dev-Journal" might not use a specific folder if not configured, 
    // but if it does, it's usually the part right before the filename.
    // For safety, let's just use regex to extract everything after /upload/(v\d+/)? up to the extension.
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (!match || !match[1]) {
      console.error("Could not extract publicId from URL:", imageUrl);
      return false;
    }
    const publicId = match[1];

    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      console.error("Failed to delete image from Cloudinary API");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error calling Cloudinary delete API:", error);
    return false;
  }
}

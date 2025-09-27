import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
    .upload(base64, {
      folder: 'grocery-store',
      resource_type: 'auto',
    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result!.secure_url);
      }
    })
  });
};

export const deleteImage = async (publicId: string): Promise<{ result: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result as { result: string });
      }
    });
  });
};

export default cloudinary;

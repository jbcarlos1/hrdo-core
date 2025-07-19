import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (imageData: string) => {
    return await cloudinary.uploader.upload(imageData, {
        folder: "inventory",
        transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }, { fetch_format: "auto" }],
    });
};

export const deleteImage = async (imageUrl: string) => {
    try {
        const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];

        await cloudinary.uploader.destroy(publicId);
        return true;
    } catch (error) {
        console.error("Failed to delete image from Cloudinary:", error);
        return false;
    }
};

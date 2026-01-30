import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Upload from file path (legacy support if needed)
const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;
        const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" });
        fs.unlinkSync(filePath);
        return response.secure_url;
    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

// Upload from buffer (memory storage)
const uploadStreamToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Stream Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        stream.end(buffer);
    });
};

export { uploadToCloudinary, uploadStreamToCloudinary };

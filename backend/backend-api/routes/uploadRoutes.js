import express from 'express';
import multer from 'multer';
import { uploadStreamToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// Multer config for memory storage (no local files)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to upload image
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Upload from buffer
        const imageUrl = await uploadStreamToCloudinary(req.file.buffer);

        if (!imageUrl) {
            return res.status(500).json({ success: false, message: "Image upload failed" });
        }

        res.status(200).json({ success: true, imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

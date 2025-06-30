// pages/api/photos.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  try {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const files = fs.existsSync(uploadDir)
      ? fs.readdirSync(uploadDir).filter((file) => allowedExtensions.test(file))
      : [];

    res.status(200).json({ images: files });
  } catch (err) {
    console.error('Error reading images:', err);
    res.status(500).json({ images: [] });
  }
}

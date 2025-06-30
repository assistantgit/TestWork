import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const response = await axios.get('https://rwl.artport.pro/commercialAgent/hs/CarrWorkApp/VagonInfo');
    const wagons = Array.isArray(response.data?.Vagons) ? response.data.Vagons : [];

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const existingPhotos = fs.existsSync(uploadDir)
      ? fs.readdirSync(uploadDir).reduce((acc, file) => {
          const vagon = file.split('.')[0];
          acc[vagon] = `/uploads/${file}`;
          return acc;
        }, {})
      : {};

    res.status(200).json({ wagons, existingPhotos });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ wagons: [], existingPhotos: {} });
  }
}
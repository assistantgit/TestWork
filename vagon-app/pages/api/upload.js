import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const uploadDir = path.join(process.cwd(), '/public/uploads');

  // Створення директорії, якщо не існує
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    filename: (name, ext, part) => {
      // Зберегти фото з назвою вагона, переданого в полях
      const vagonNumber = part.originalFilename?.split('.')[0] || 'default';
      return `${vagonNumber}${ext}`;
    },
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Form error:', err);
      return res.status(500).json({ message: 'Помилка сервера при обробці файлу' });
    }

    try {
      const file = files.file[0];
      const vagonNumber = fields.vagonNumber[0];
      const ext = path.extname(file.originalFilename);
      const newPath = path.join(uploadDir, `${vagonNumber}${ext}`);
      fs.renameSync(file.filepath, newPath);

      return res.status(200).json({ message: 'Фото завантажено' });
    } catch (e) {
      console.error('Rename error:', e);
      return res.status(500).json({ message: 'Помилка при збереженні файлу' });
    }
  });
}

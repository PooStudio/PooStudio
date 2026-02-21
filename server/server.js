const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const app = express();
app.use(cors({ origin: ['https://poostudio.github.io', 'http://localhost:5500', 'http://localhost:3000'] }));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const uid = req.body.uid;
    if (!uid) return res.status(400).json({ error: 'missing-uid' });
    if (!req.file) return res.status(400).json({ error: 'missing-file' });
    const buffer = req.file.buffer;
    const userDir = path.join(UPLOAD_DIR, uid);
    fs.mkdirSync(userDir, { recursive: true });
    const filePath = path.join(userDir, 'avatar.jpg');
    fs.writeFileSync(filePath, buffer);
    const urlPath = `/uploads/${encodeURIComponent(uid)}/avatar.jpg`;
    return res.json({ url: urlPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server-error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Upload server listening on', port));

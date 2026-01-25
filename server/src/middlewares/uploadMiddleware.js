const multer = require('multer');

// Memory storage keeps payload in RAM; replace with disk/S3 as needed.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Use as a route middleware: upload.single('image')
module.exports = upload;

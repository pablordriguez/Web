const fs = require('fs');
const path = require('path');

// Upload a file
exports.uploadFile = (req, res) => {
  const file = req.files.file;
  const uploadPath = path.join(__dirname, '../uploads', file.name);

  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading the file' });
    }
    res.status(200).json({ message: 'File uploaded successfully', filePath: uploadPath });
  });
};

// Get uploaded files
exports.getFiles = (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, '../uploads'));
  res.status(200).json({ files });
};

const multer = require('multer');

const storage = multer.memoryStorage(); // use memory to send IPFS
const upload = multer({ storage });

module.exports = upload;
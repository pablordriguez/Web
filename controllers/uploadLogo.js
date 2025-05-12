const { uploadFileToIPFS } = require('../utils/handleStorage');
const User = require('../models/user');

const uploadLogo = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ipfsUrl = await uploadFileToIPFS(file);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { logo: ipfsUrl },
      { new: true }
    );

    res.status(200).json({
      message: 'Logo uploaded successfully',
      logo: ipfsUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading logo:', error.message);
    res.status(500).json({ error: 'Error uploading the logo' });
  }
};

module.exports = { uploadLogo };

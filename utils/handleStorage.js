const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const uploadFileToIPFS = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    console.log('Sending to Pinata with JWT:', process.env.PINATA_JWT?.slice(0, 10)); // cropped for security
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );

    console.log('Pinata response:', response.data);

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error.response?.data || error.message);
    throw new Error('Failed to upload to IPFS');
  }
};

module.exports = { uploadFileToIPFS };
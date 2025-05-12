// utils/handleIPFS.js
const axios = require('axios');
const FormData = require('form-data');

const PINATA_JWT = process.env.PINATA_JWT; // Token, without "Bearer "

const uploadToIPFS = async (fileBuffer, originalName) => {
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: originalName,
    contentType: 'application/octet-stream'
  });

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return {
      url: `${process.env.PINATA_GATEWAY_URL}${res.data.IpfsHash}`,
      ipfsHash: res.data.IpfsHash
    };
  } catch (err) {
    console.error('Error uploading IPFS:', err.response?.data || err.message);
    throw new Error('Can`t upload IPFS');
  }
};

module.exports = { uploadToIPFS };
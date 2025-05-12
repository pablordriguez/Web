const { sendEmail } = require('../utils/handleEmail');
const { handleHttpError } = require('../utils/handleError');
const { matchedData } = require('express-validator');
const User = require('../models/user');

const send = async (req, res) => {
  try {
    const info = matchedData(req);

    const user = await User.findOne({ email: info.to });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verificationCode) {
      return res.status(400).json({ message: 'This user does not have a verification code' });
    }

    await sendEmail({
      to: info.to,
      subject: info.subject || 'Your verification code',
      text: info.text || `Your verification code is: ${user.verificationCode}`,
      from: info.from
    });

    res.send({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_SEND_EMAIL');
  }
};

module.exports = { send };

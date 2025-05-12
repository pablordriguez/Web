const handleError = (err, res) => {
    console.error(err);
    res.status(500).json({ message: 'An error occurred' });
  };
  
  module.exports = handleError;
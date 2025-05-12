const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.updateCompanyData = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        companyName,
        companyCif,
        companyAddress,
        companyStreet,
        companyNumber,
        companyPostal,
        companyCity,
        companyProvince,
        isAutonomous
    } = req.body.company;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const cifPattern = /^[A-Z0-9]{9}$/;

        if (isAutonomous) {
            if (!companyName || !companyCif) {
                return res.status(400).json({ message: 'For self-employed users, company name and CIF are required' });
            }

            if (!cifPattern.test(companyCif)) {
                return res.status(400).json({ message: 'The CIF is not in a valid format' });
            }

            // Copy company data to personal data
            user.firstName = companyName;
            user.lastName = '';
            user.nif = companyCif;
        }

        // Common validation if not self-employed or for company data
        if (!companyName || !companyCif || !companyAddress || !companyStreet || !companyNumber || !companyPostal || !companyCity || !companyProvince) {
            return res.status(400).json({ message: 'All company fields are required' });
        }

        if (!cifPattern.test(companyCif)) {
            return res.status(400).json({ message: 'The CIF is not in a valid format' });
        }

        // Update company data
        user.companyName = companyName;
        user.companyCif = companyCif;
        user.companyAddress = companyAddress;
        user.companyStreet = companyStreet;
        user.companyNumber = companyNumber;
        user.companyPostal = companyPostal;
        user.companyCity = companyCity;
        user.companyProvince = companyProvince;

        await user.save();

        res.status(200).json({ message: 'Company data updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating company data' });
    }
};

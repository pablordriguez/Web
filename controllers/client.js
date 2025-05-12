// controllers/client.js
const Client = require("../models/client");

// Create client
exports.createClient = async (req, res) => {
  const { name, email, phone, address, contactPerson } = req.body;
  const userId = req.user.id;
  const companyId = req.user.company;

  try {
    const existing = await Client.findOne({ name, createdBy: userId });
    if (existing) {
      return res.status(400).json({ message: "Client already created by this user" });
    }

    const client = new Client({
      name,
      email,
      phone,
      address,
      contactPerson,
      createdBy: userId,
      company: companyId,
    });

    await client.save();
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating client" });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id
      },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating client" });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company;

    const clients = await Client.find({
      archived: false,
      $or: [
        { createdBy: userId },
        { company: companyId }
      ]
    });

    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: "Error getting clients" });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { company: req.user.company }
      ]
    });

    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Error getting client" });
  }
};

// Archive client (soft delete)
exports.archiveClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
        archived: false
      },
      { archived: true },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found or already archived" });
    }

    res.status(200).json({
      message: "Client archived successfully",
      client
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error archiving client" });
  }
};

// Restore client
exports.restoreClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
        archived: true
      },
      { archived: false },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found or not archived" });
    res.json({ message: "Client restored", client });
  } catch (err) {
    res.status(500).json({ message: "Error restoring client" });
  }
};

// Hard delete
exports.deleteClient = async (req, res) => {
  try {
    const deleted = await Client.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!deleted) return res.status(404).json({ message: "Client not found" });
    res.json({ message: "Client permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting client" });
  }
};
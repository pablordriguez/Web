// controllers/deliveryNote.js
const DeliveryNote = require('../models/deliveryNote');
const Project = require('../models/project');
const Client = require('../models/client');
const User = require('../models/user');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { uploadToIPFS } = require('../utils/handleIPFS');

exports.createNote = async (req, res) => {
  try {
    const note = await DeliveryNote.create({
      ...req.body,
      createdBy: req.user.id,
      company: req.user.company
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Error creating delivery note' });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await DeliveryNote.find({
      $or: [{ createdBy: req.user.id }, { company: req.user.company }],
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Error getting delivery notes' });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id })
      .populate('createdBy')
      .populate('client')
      .populate('project');
    if (!note) return res.status(404).json({ message: 'Not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Error getting delivery note' });
  }
};

exports.generatePDF = async (req, res, filenameOverride) => {
  try {
    const note = await DeliveryNote.findById(req.params.id || req.body.noteId)
      .populate('project client createdBy');

    if (!note) throw new Error('Delivery note not found');

    const filename = filenameOverride || `delivery-note-${note._id}.pdf`;
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    const filepath = path.join(publicDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filepath));

    doc.fontSize(20).text(`Project Delivery Note`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
      .text(`Date: ${new Date(note.date).toLocaleDateString()}`)
      .text(`Project: ${note.project?.name || 'Unknown project'}`)
      .text(`Client: ${note.client?.name || 'Unknown client'}`)
      .text(`Created by: ${note.createdBy?.email || 'Unknown user'}`)
      .moveDown();

    doc.fontSize(14).text(`Details:`).moveDown(0.5);
    note.data.forEach((item, i) => {
      doc.fontSize(12).text(`${i + 1}.`);
      if (item.person) doc.text(`   - Person: ${item.person}`);
      if (item.hours) doc.text(`   - Hours: ${item.hours}`);
      if (item.material) doc.text(`   - Material: ${item.material}`);
      if (item.quantity) doc.text(`   - Quantity: ${item.quantity}`);
      doc.moveDown(0.5);
    });

    if (note.signed && note.signatureUrl) {
      const signaturePath = path.join(__dirname, `../public/signature-${note._id}.png`);
      const writer = fs.createWriteStream(signaturePath);
      const response = await axios({ url: note.signatureUrl, responseType: 'stream' });
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      doc.addPage().fontSize(16).text('DIGITAL SIGNATURE:', { align: 'center' });
      doc.image(signaturePath, { fit: [250, 250], align: 'center' });
      fs.unlinkSync(signaturePath);
    }

    doc.end();
    await new Promise((resolve) => doc.on('finish', resolve));

    return filepath;
  } catch (err) {
    throw err;
  }
};

exports.getPDF = async (req, res) => {
  try {
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Delivery note not found' });

    if (note.pdfUrl) {
      return res.redirect(note.pdfUrl);
    }

    const filePath = await exports.generatePDF({ params: { id: req.params.id }, user: req.user });
    res.download(filePath, (err) => {
      if (!err) fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating or downloading PDF', error: err.message });
  }
};

exports.signNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await DeliveryNote.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Delivery note not found' });
    if (note.signed) return res.status(400).json({ message: 'The delivery note is already signed' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No signature attached' });
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const pdfPath = path.join(tempDir, `${noteId}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(16).text(`Delivery Note #${noteId}`, { align: 'center' });
    doc.text(`Type: ${note.type}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text('---');
    doc.text('Data:');
    note.data.forEach(item => {
      doc.text(`- ${item.person || item.material}: ${item.hours || item.quantity}`);
    });
    doc.moveDown();
    doc.text('Client signature:');
    doc.image(req.file.buffer, { fit: [150, 150] });

    doc.end();

    stream.on('finish', async () => {
      const fileBuffer = fs.readFileSync(pdfPath);
      const { url } = await uploadToIPFS(fileBuffer, `${noteId}.pdf`);
      fs.unlinkSync(pdfPath);

      note.signed = true;
      note.signatureUrl = url;
      note.pdfUrl = url;
      await note.save();

      res.status(200).json({ message: 'Delivery note signed successfully', note });
    });

  } catch (err) {
    console.error("Error signing delivery note:", err);
    res.status(500).json({ message: 'Error signing delivery note', error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.signed) return res.status(400).json({ message: 'Cannot delete a signed delivery note' });
    await DeliveryNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Delivery note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting delivery note' });
  }
};

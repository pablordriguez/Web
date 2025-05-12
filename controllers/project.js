// controllers/project.js
const Project = require("../models/project");

exports.createProject = async (req, res) => {
  const { name, description, client } = req.body;
  const userId = req.user.id;
  const companyId = req.user.company;

  try {
    const existing = await Project.findOne({ name, createdBy: userId });
    if (existing) return res.status(400).json({ message: "A project with this name already exists." });

    const project = new Project({ name, description, client, createdBy: userId, company: companyId });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error creating project" });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Error updating project" });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      archived: false,
      $or: [{ createdBy: req.user.id }, { company: req.user.company }]
    }).populate("client");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error getting projects" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ createdBy: req.user.id }, { company: req.user.company }]
    }).populate("client");

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Error getting project" });
  }
};

// controllers/project.js

exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id  // Ensures only the creator can archive it
      },
      { archived: true },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    res.json({ message: "Project archived", project });
  } catch (err) {
    res.status(500).json({ message: "Error archiving project" });
  }
};

exports.restoreProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id  // Same as archiving
      },
      { archived: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    res.json({ message: "Project restored", project });
  } catch (err) {
    res.status(500).json({ message: "Error restoring project" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project" });
  }
};

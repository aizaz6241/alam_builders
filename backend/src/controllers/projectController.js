const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({});
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Public
const createProject = async (req, res) => {
  try {
    const { name, location, clientCompany, startDate, expectedCompletionDate, status } = req.body;
    const project = new Project({
      name, location, clientCompany, startDate, expectedCompletionDate, status
    });
    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public
const updateProject = async (req, res) => {
  try {
    const { name, location, clientCompany, startDate, expectedCompletionDate, status } = req.body;
    const project = await Project.findById(req.params.id);

    if (project) {
      project.name = name || project.name;
      project.location = location || project.location;
      project.clientCompany = clientCompany || project.clientCompany;
      project.startDate = startDate || project.startDate;
      project.expectedCompletionDate = expectedCompletionDate || project.expectedCompletionDate;
      project.status = status || project.status;

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject
};

const JobApplication = require("../models/JobApplication.js");

exports.addJob = async (req, res) => {
  try {
    const { companyName, role, jobLink, notes, status } = req.body;
    const job = await JobApplication.create({
      userId: req.user,
      companyName,
      role,
      jobLink,
      notes,
      status: status || "Applied",
    });
    return res.status(201).json({ message: "Job application added successfully", job });
  } catch (error) {
    return res.status(500).json({ message: "Error adding job", error: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await JobApplication.find({ userId: req.user });
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await JobApplication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json({ message: "Job application updated successfully", job });
  } catch (error) {
    return res.status(500).json({ message: "Error updating job", error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await JobApplication.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json({ message: "Job application deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting job", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const jobs = await JobApplication.find({ userId: req.user });
    const stats = {
      total: jobs.length,
      interviews: jobs.filter((j) => j.status === "Interviewing").length,
      offers: jobs.filter((j) => j.status === "Offered").length,
      rejected: jobs.filter((j) => j.status === "Rejected").length,
    };
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: "Error calculating stats", error: error.message });
  }
};

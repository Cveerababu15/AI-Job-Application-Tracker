const ResumeAnalysis = require("../models/ResumeAnalysis.js");
const analyzeAI = require("../services/aiService.js");
const pdfParse = require("pdf-parse");

exports.analyzeResume = async (req, res) => {
  try {
    const jobDescription = (req.body.jobDescription || "").trim();
    let resumeText = req.body.resumeText;

    if (req.file) {
      if (!req.file.buffer?.length) {
        return res.status(400).json({ message: "Uploaded PDF is empty or unreadable." });
      }
      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = (pdfData.text || "").trim();
      } catch (parseError) {
        console.error("PDF parse error:", parseError.message);
        return res.status(400).json({
          message: "Could not read this PDF. Try exporting it again or use a text-based PDF.",
          error: parseError.message,
        });
      }
    }

    if (!resumeText) {
      return res.status(400).json({
        message: "No resume text found. Upload a text-based PDF or paste resume text.",
      });
    }

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required for comparison analysis." });
    }

    const aiResult = await analyzeAI(resumeText, jobDescription);

    const analysis = await ResumeAnalysis.create({
      userId: req.user,
      resumeText: resumeText.slice(0, 15000),
      jobDescription: jobDescription.slice(0, 15000),
      atsScore: aiResult.atsScore ?? 0,
      missingSkills: aiResult.missingSkills || [],
      skillsToAdd: aiResult.skillsToAdd || [],
      summary: aiResult.summary || "",
      keyChanges: aiResult.keyChanges || "",
      suggestions: aiResult.suggestions || "No suggestions available.",
    });

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      analysis,
      data: aiResult,
    });
  } catch (error) {
    console.error("Analysis Error:", error.message);
    res.status(error.statusCode || 500).json({
      message: "Error analyzing resume",
      error: error.message,
    });
  }
};

exports.skillGapAnalysis = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required for skill gap analysis." });
    }

    const aiResult = {
      missingSkills: ["Skill X", "Skill Y"],
      suggestions: "Consider taking courses or gaining experience in Skill X and Skill Y to improve your chances.",
    };

    res.json({ message: "Skill gap analysis completed", result: aiResult });
  } catch (error) {
    res.status(500).json({ message: "Skill gap analysis failed", error: error.message });
  }
};

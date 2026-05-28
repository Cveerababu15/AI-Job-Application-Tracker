const ResumeAnalysis = require("../models/ResumeAnalysis.js");
const analyzeAI = require("../services/aiService.js");
const pdfParse = require("pdf-parse");
const fs = require("fs");

exports.analyzeResume = async (req, res) => {
    const uploadedFilePath = req.file?.path;

    try {
        const jobDescription = (req.body.jobDescription || "").trim();
        let resumeText = req.body.resumeText;

        if (req.file) {
            const dataBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(dataBuffer);
            resumeText = pdfData.text;
        }

        if (!resumeText) {
            return res.status(400).json({ message: "No resume provided. Please upload a PDF or provide text." });
        }

        if (!jobDescription) {
            return res.status(400).json({ message: "Job description is required for comparison analysis." });
        }

        const aiResult = await analyzeAI(resumeText, jobDescription);

        const analysis = await ResumeAnalysis.create({
            userId: req.user,
            resumeText,
            jobDescription,
            atsScore: aiResult.atsScore ?? 0,
            missingSkills: aiResult.missingSkills || [],
            skillsToAdd: aiResult.skillsToAdd || [],
            summary: aiResult.summary || "",
            keyChanges: aiResult.keyChanges || "",
            suggestions: aiResult.suggestions || "No suggestions available."
        });

        // Backward compatible response:
        // - Keep existing fields (`message`, `analysis`)
        // - Add expanded contract (`success`, `data`) for new frontend rendering
        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            analysis, // DB record (existing shape)
            data: aiResult, // full AI result (expanded shape)
        });
    } catch (error) {
        console.error("Analysis Error:", error.message);
        res
            .status(error.statusCode || 500)
            .json({ message: "Error analyzing resume", error: error.message });
    } finally {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
            try {
                fs.unlinkSync(uploadedFilePath);
            } catch (cleanupError) {
                console.warn("File cleanup failed:", cleanupError.message);
            }
        }
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
            suggestions: "Consider taking courses or gaining experience in Skill X and Skill Y to improve your chances."
        };

        res.json({ message: "Skill gap analysis completed", result: aiResult });
    } catch (error) {
        res.status(500).json({ message: "Skill gap analysis failed", error: error.message });
    }
};

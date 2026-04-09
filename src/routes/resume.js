import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { userAuth } from "../middleware/auth.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const resumeRouter = express.Router();

// Memory storage is fine for short-lived analysis
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

resumeRouter.post("/analyze", userAuth, upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a resume file (PDF)" });
        }

        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Currently only PDF files are supported" });
        }

        // Extract text from PDF
        const parser = new PDFParse({ data: req.file.buffer });
        const pdfData = await parser.getText();
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ message: "The resume seems too short or empty for analysis." });
        }

        // Initialize Gemini model
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            temperature: 0.4,
        });

        const systemPrompt = `You are an elite Senior Tech Recruiter, Hiring Manager, and Resume Consultant specializing in Software Engineering roles (Frontend, Backend, Full Stack, Mobile).

Your task is to deeply analyze the provided resume and return a highly detailed, honest, and constructive evaluation.

⚠️ Important Rules:
- Be specific, not generic
- Avoid vague suggestions like "improve skills"
- Provide actionable, real-world improvements
- Evaluate from a FAANG / product company hiring perspective
- Focus on impact, scalability, ownership, and technical depth

You MUST return ONLY a valid JSON object with the following structure:

{
  "overall_score": 78,
  "category_scores": {
    "impact": 70,
    "technical_depth": 75,
    "project_quality": 80,
    "experience_strength": 78,
    "ats_optimization": 65,
    "clarity_and_structure": 72
  },
  "summary": "2-3 line professional evaluation of the candidate.",
  
  "strengths": [
    "Specific strong point with explanation",
    "Another strong point with context"
  ],

  "weaknesses": [
    "Clear issue with explanation",
    "Missing measurable impact in projects"
  ],

  "improvements": [
    "Add measurable metrics (e.g., improved performance by X%)",
    "Explain challenges faced and how they were solved",
    "Show ownership and leadership experience"
  ],

  "gaps_identified": {
    "technical_gaps": [
      "Missing system design experience",
      "Lack of backend scalability examples"
    ],
    "experience_gaps": [
      "No leadership or mentoring mentioned",
      "No large-scale system handling explained"
    ],
    "market_gaps": [
      "Missing trending skills like AWS / CI-CD",
      "No open-source contributions"
    ]
  },

  "action_plan": [
    "Add 2-3 quantified achievements in each project",
    "Include one complex project explaining architecture",
    "Learn and add AWS basics + deployment experience",
    "Highlight any mentoring or leadership work"
  ],

  "ats_feedback": [
    "Resume lacks important keywords like scalability, optimization",
    "Use standard section headings for ATS parsing"
  ],

  "final_verdict": "Short hiring decision style summary (e.g., Strong mid-level candidate but needs impact and system design depth to reach senior level)."
}`;

        const userPrompt = `Analyze this resume text:
        ---
        ${resumeText}
        ---`;

        const result = await model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);

        // Clean and parse the response
        let content = result.content;
        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }

        const cleanJson = content.replace(/```json|```/g, "").trim();

        try {
            const analysis = JSON.parse(cleanJson);
            res.json({ success: true, analysis });
        } catch (parseError) {
            console.error("Gemini JSON Parsing Error:", content);
            res.status(500).json({
                message: "Got a response but failed to parse it. Please try again.",
                rawResponse: content
            });
        }

    } catch (error) {
        console.error("Resume Checker Error:", error);
        res.status(500).json({ message: "Failed to analyze resume: " + error.message });
    }
});

export default resumeRouter;

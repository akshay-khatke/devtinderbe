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
            model: "gemini-1.5-flash",
            temperature: 0.4,
        });

        const systemPrompt = `You are an elite Tech Recruiter and Resume Consultant. 
        Your task is to analyze the provided resume text and give a highly professional, brutally honest, yet constructive feedback.
        
        You MUST return the response ONLY as a valid JSON object with the following structure:
        {
          "score": 85, 
          "summary": "Short overview of the resume.",
          "strengths": ["list", "of", "positives"],
          "improvements": ["specific", "things", "to", "add/change"],
          "tips": ["actionable", "advice", "for", "career"]
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

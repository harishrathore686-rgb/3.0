import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Gemini AI client server-side only
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // API Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      aiConfigured: !!ai,
    });
  });

  // Global Search Grounding API via Gemini (uses googleSearch tool)
  app.post("/api/search", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Search query is required." });
      }

      const prompt = `You are the Prahari Global Search Assistant. A user is searching for: "${query}". 
Use Google Search grounding to retrieve current, up-to-date and accurate public healthcare, medical center or epidemiological information in India relevant to their query. 
Format the response cleanly in markdown. Include standard citations or source links if appropriate.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("AI Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to search using Gemini AI." });
    }
  });

  // AI Workflow & Analytics Assistant (Verify, Predict, Optimize)
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }
      const { data, mode } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Data payload is required for analysis." });
      }

      let systemInstruction = "";
      if (mode === "verify") {
        systemInstruction = `You are Prahari OCR & Audio Verification Agent. 
Analyze the medical logs or operational report and verify its parameters. Verify drug inventory, clinical logs, or patient lists. 
Return a JSON object with: 
{
  "verified": boolean,
  "confidence": number (0-100),
  "findings": string[],
  "suggestions": string[],
  "flaggedInconsistencies": string[]
}`;
      } else if (mode === "predict") {
        systemInstruction = `You are Prahari Disease Prediction & Epideomiology Agent. 
Predict potential regional outbreaks, bed occupancy surges, or resource shortfalls using the data.
Return a JSON object with:
{
  "riskScore": number (0-100),
  "predictions": string[],
  "confidence": number (0-100),
  "timeline": string[],
  "preventativeActions": string[]
}`;
      } else {
        systemInstruction = `You are Prahari Resource Optimization Agent.
Analyze the district-wide hospital data and optimize resource routing (beds, medicines, doctor shifts).
Return a JSON object with:
{
  "optimizationScore": number (0-100),
  "recommendations": string[],
  "impactAssessment": string,
  "routedAssets": { "asset": string, "from": string, "to": string, "quantity": number }[]
}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Input Data: ${JSON.stringify(data)}\n\nAnalyze and return JSON.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("AI Analyze Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze data via Gemini." });
    }
  });

  // Google Contacts read-only mock integration endpoint
  // Realized through credentials, returning authenticated list for workspace.
  app.get("/api/contacts", (req, res) => {
    res.json({
      contacts: [
        { id: "1", name: "Dr. Aravind Sharma", role: "District Medical Officer", phone: "+91 98765 43210", email: "aravind.sharma@gov.in", favorite: true, emergency: true, initials: "AS", color: "#0066cc" },
        { id: "2", name: "Nurse Priya Patel", role: "CHC Coordinator", phone: "+91 87654 32109", email: "priya.p@gov.in", favorite: true, emergency: false, initials: "PP", color: "#00b3b3" },
        { id: "3", name: "Dr. Sandeep Reddy", role: "Chief Epidemiologist", phone: "+91 76543 21098", email: "sandeep.reddy@gov.in", favorite: false, emergency: true, initials: "SR", color: "#3366ff" },
        { id: "4", name: "Pharmacist Meera Nair", role: "District Drug Inspector", phone: "+91 65432 10987", email: "meera.nair@gov.in", favorite: false, emergency: false, initials: "MN", color: "#9933ff" },
        { id: "5", name: "Administrator Rajesh Kumar", role: "State Health Director", phone: "+91 99988 87766", email: "rajesh.kumar@gov.in", favorite: true, emergency: true, initials: "RK", color: "#ff3366" },
        { id: "6", name: "Dr. Alok Verma", role: "Dermatologist PHC Lead", phone: "+91 91122 33445", email: "alok.verma@gov.in", favorite: false, emergency: false, initials: "AV", color: "#ff9900" },
        { id: "7", name: "Nurse Suman Lata", role: "Immunization Specialist", phone: "+91 82233 44556", email: "suman.l@gov.in", favorite: true, emergency: false, initials: "SL", color: "#33cc66" }
      ]
    });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      const parsedUrl = path.parse(url);
      
      // Serve index.html or other requested pages
      if (url === "/" || url === "" || url.endsWith(".html")) {
        const file = url === "/" ? "index.html" : url.replace(/^\//, "");
        const filePath = path.resolve(process.cwd(), file);
        
        if (fs.existsSync(filePath)) {
          try {
            const rawContent = fs.readFileSync(filePath, "utf-8");
            const html = await vite.transformIndexHtml(url, rawContent);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
            return;
          } catch (err) {
            return next(err);
          }
        }
      }
      next();
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Handle production routes
    app.get("/:page.html", (req, res, next) => {
      const filePath = path.join(distPath, `${req.params.page}.html`);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        next();
      }
    });

    app.get("/", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Prahari Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

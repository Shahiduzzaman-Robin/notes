const { GoogleGenAI } = require("@google/genai");

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const MODEL_NAME = "gemini-2.0-flash";

// Global config for most flexible and creative responses
const AI_CONFIG = {
  safetySettings: [
    { category: "HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000,
  }
};

exports.summarizeNote = async (req, res) => {
  try {
    const { content, title } = req.body;
    const ai = getAIClient();
    
    if (!ai) {
      return res.status(500).json({ message: "GEMINI_API_KEY is missing on the server." });
    }

    const prompt = `
      You are an expert assistant. Please summarize the following note.
      Title: ${title}
      Content: ${content}
      
      Provide a concise summary in exactly 3 bullet points. 
      Use clear and professional language.
    `;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: AI_CONFIG
    });
    
    res.json({ summary: result.text });
  } catch (error) {
    console.error("AI Summarize Error:", error);
    res.status(500).json({ message: error.message || "Failed to summarize note" });
  }
};

exports.chatWithNote = async (req, res) => {
  try {
    const { content, title, message, history } = req.body;
    const ai = getAIClient();
    
    if (!ai) {
      return res.status(500).json({ message: "GEMINI_API_KEY is not configured on Render dashboard." });
    }

    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.parts?.[0]?.text || h.content || "" }]
    }));

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: formattedHistory,
      config: AI_CONFIG
    });

    const prompt = `
      Context (Current Note):
      Title: ${title}
      Content: ${content}
      
      User Question: ${message}
      
      Please answer the question based strictly on the note content provided above. If the information is not in the note, say you don't know.
    `;

    const result = await chat.sendMessage(prompt);
    
    res.json({ reply: result.text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ message: error.message || "Failed to chat with note" });
  }
};

exports.suggestTags = async (req, res) => {
  try {
    const { content, title } = req.body;
    const ai = getAIClient();
    
    if (!ai) {
      return res.status(500).json({ message: "GEMINI_API_KEY missing." });
    }

    const prompt = `
      Analyze this note and suggest 5 relevant one-word tags.
      Title: ${title}
      Content: ${content}
      
      Return only the tags separated by commas. No other text.
    `;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: AI_CONFIG
    });
    
    const text = result.text;
    const tags = text.split(',').map(tag => tag.trim());
    res.json({ tags });
  } catch (error) {
    console.error("AI Tag Suggestion Error:", error);
    res.status(500).json({ message: error.message || "Failed to suggest tags" });
  }
};

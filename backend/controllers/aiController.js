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
    if (!content?.trim() && !title?.trim()) {
      return res.status(400).json({ message: "Note is empty. Please add some content to summarize." });
    }

    const prompt = `
      Summarize this note in 3 bullet points.
      Title: ${title || "Untitled"}
      Content: ${content || "No content provided."}
    `;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [prompt],
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
    if (!content?.trim() && !title?.trim()) {
      return res.status(400).json({ message: "Add content to get tag suggestions." });
    }

    const prompt = `Suggest 5 one-word tags for this note: "${title} ${content}". Return ONLY commas-separated tags.`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [prompt],
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

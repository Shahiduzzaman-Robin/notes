const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.summarizeNote = async (req, res) => {
  try {
    const { content, title } = req.body;
    
    const prompt = `
      You are an expert assistant. Please summarize the following note.
      Title: ${title}
      Content: ${content}
      
      Provide a concise summary in exactly 3 bullet points. 
      Use clear and professional language.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ summary: text });
  } catch (error) {
    console.error("AI Summarize Error:", error);
    res.status(500).json({ message: "Failed to summarize note" });
  }
};

exports.chatWithNote = async (req, res) => {
  try {
    const { content, title, message, history } = req.body;
    
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const prompt = `
      Context (Current Note):
      Title: ${title}
      Content: ${content}
      
      User Question: ${message}
      
      Please answer the question based strictly on the note content provided above. If the information is not in the note, say you don't know.
    `;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ message: "Failed to chat with note" });
  }
};

exports.suggestTags = async (req, res) => {
  try {
    const { content, title } = req.body;
    
    const prompt = `
      Analyze this note and suggest 5 relevant one-word tags.
      Title: ${title}
      Content: ${content}
      
      Return only the tags separated by commas. No other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const tags = text.split(',').map(tag => tag.trim());
    res.json({ tags });
  } catch (error) {
    console.error("AI Tag Suggestion Error:", error);
    res.status(500).json({ message: "Failed to suggest tags" });
  }
};

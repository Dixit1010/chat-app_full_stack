import Groq from "groq-sdk";
import rateLimit from "express-rate-limit";

// Use an environment variable or dummy for local testing
const apiKey = process.env.GROQ_API_KEY || "gsk_dummy";
const groq = new Groq({ apiKey });

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes
  message: { message: "Too many AI requests from this IP, please try again later." }
});

export const getSmartReply = async (req, res, next) => {
  try {
    const { messagesContext } = req.body;
    const prompt = `Based on the following chat context, suggest 3 short, natural replies for the current user. Return ONLY a JSON array of strings, nothing else.\nContext: ${messagesContext}`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });
    
    let responseText = chatCompletion.choices[0]?.message?.content || "[]";
    // Strip markdown formatting if any
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const suggestions = JSON.parse(responseText);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(200).json(["Sounds good!", "Okay", "Let me check"]);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const { chatHistory } = req.body;
    const prompt = `Summarize the following chat conversation in 2-3 sentences:\n${chatHistory}`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });
    
    const summary = chatCompletion.choices[0]?.message?.content || "No summary available.";
    res.status(200).json({ summary });
  } catch (error) {
    res.status(200).json({ summary: "Summary unavailable (check API key)." });
  }
};

export const getTranslation = async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;
    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated string, nothing else.\nText: ${text}`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });
    
    const translation = chatCompletion.choices[0]?.message?.content || text;
    res.status(200).json({ translation });
  } catch (error) {
    res.status(200).json({ translation: text });
  }
};

require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require("@google/genai");
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("No GEMINI_API_KEY found in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
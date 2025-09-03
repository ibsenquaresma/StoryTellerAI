// ---------------------------
// Imports
// ---------------------------
import express from "express";                // Framework to build the HTTP server
import fetch from "node-fetch";              // Used to make HTTP requests (for the Groq API)
import dotenv from "dotenv";                 // Loads environment variables from .env file
import cors from "cors";                     // Middleware to enable CORS (frontend can call backend)
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"; // SDK for ElevenLabs API
import fs from "fs";                         // Node.js filesystem module (to load JSON)

// ---------------------------
// Environment setup
// ---------------------------

// Load environment variables (e.g., API keys, port, etc.)
dotenv.config();

// Create an Express app
const app = express();

// Enable CORS so requests from the frontend (http://localhost:5173) are allowed
app.use(cors({ origin: "http://localhost:5173" }));

// Parse incoming requests with JSON bodies
app.use(express.json());

// Set server port (use PORT from .env, or default to 4000)
const PORT = process.env.PORT || 4000;

// ---------------------------
// Load systemPrompts.json
// ---------------------------

// Read systemPrompts.json once when the server starts
const prompts = JSON.parse(fs.readFileSync("./systemPrompts.json", "utf-8"));

// ---------------------------
// ElevenLabs setup
// ---------------------------

// Initialize ElevenLabs client with the API key
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

// ---------------------------
// Endpoint: Generate a story
// ---------------------------
app.post("/api/story", async (req, res) => {
  try {
    // Extract prompt and language from frontend request
    const { prompt, language } = req.body;
    console.log("Language prompt:", language, prompt);

    // Validate: a prompt is required
    if (!prompt) {
      return res.status(400).json({ error: "The 'prompt' field is required." });
    }

    // Select system configuration (prompt + voice) from JSON
    const systemConfig = prompts[language] || prompts["english"];
    const systemMessage = systemConfig.prompt;
    console.log("Using system message:", systemMessage);

    // Create the system prompt (instructions for the model)
    const fullSystemPrompt = `You are a storyteller. Always write the story in this language: ${systemMessage}. Do not use any other language. Be creative and detailed.`;

    // Create the user prompt (based on the user's input + enforced language)
    const fullUserPrompt = `${prompt}\nWrite the story exclusively in ${systemMessage}.`;

    // Call Groq API to generate a story
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // API key
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Chosen model
          messages: [
            { role: "system", content: fullSystemPrompt }, // Instruction for the AI
            { role: "user", content: fullUserPrompt },     // User’s request
          ],
          temperature: 0.7, // Randomness (higher = more creative)
          max_tokens: 1024, // Maximum length of response
        }),
      }
    );

    // If Groq API returned an error, handle it
    if (!groqResponse.ok) {
      const errTxt = await groqResponse.text();
      return res
        .status(500)
        .json({ error: "Error generating story", detail: errTxt });
    }

    // Parse the response from Groq API
    const groqData = await groqResponse.json();
    const story = groqData.choices[0].message.content;

    // If no story was returned, throw error
    if (!story) {
      return res.status(500).json({ error: "Groq did not return a story" });
    }

    // Send story back to frontend
    res.json({ story, language });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

// ---------------------------
// Endpoint: Generate audio
// ---------------------------
app.post("/api/story/audio", async (req, res) => {
  try {
    // Extract text + language from frontend request
    const { text, language } = req.body;

    // Validate: text is required
    if (!text) {
      return res
        .status(400)
        .json({ error: "Text is required to generate audio." });
    }

    // Select voice from JSON based on language
    const systemConfig = prompts[language] || prompts["english"];
    const voiceId = systemConfig.voiceId;

    // If no voice configured, throw error
    if (!voiceId) {
      return res.status(500).json({
        error: `No voiceId configured for language: ${language}`,
      });
    }

    // Generate audio with ElevenLabs API
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,                           // Text to convert
      modelId: "eleven_multilingual_v2", // Multilingual model
      outputFormat: "mp3_44100_128",     // Output format: MP3
    });

    // Convert audio stream into a Buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Send audio back to frontend as MP3
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error generating audio", detail: err.message });
  }
});

// ---------------------------
// Start the server
// ---------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
// ---------------------------
// End of file
// ---------------------------
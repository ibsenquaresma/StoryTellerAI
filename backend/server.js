import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS for requests coming from your frontend
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

// ---------------------------
// Endpoint to generate a story
// ---------------------------
app.post("/api/story", async (req, res) => {
  try {
    const { prompt, language } = req.body;
    console.log("Language prompt:", language, prompt);

    // Validate input
    if (!prompt) {
      return res.status(400).json({ error: "The 'prompt' field is required." });
    }

    // Predefined system prompts in different languages
    const systemPrompts = {
      english: "You are a helpful assistant. Always respond in English.",
      portuguese: "Você é um assistente útil. Responda sempre em português.",
      spanish: "Eres un asistente útil. Responde siempre en español.",
      french: "Vous êtes un assistant utile. Répondez toujours en français.",
      german: "Sie sind ein hilfreicher Assistent. Antworten Sie immer auf Deutsch.",
      italian: "Sei un assistente utile. Rispondi sempre in italiano.",
      japanese: "あなたは役立つアシスタントです。常に日本語で答えてください。",
      chinese: "你是一个有用的助手。请始终用中文回答。",
    };
    console.log("System prompts available:", systemPrompts);

    // Select the system message for the chosen language
    const systemMessage = systemPrompts[language] || systemPrompts["english"];
    console.log("Using system message:", systemMessage);

    // Reinforced prompt to force the model to respond in the chosen language
    const fullSystemPrompt = `You are a storyteller. Always write the story in this language: ${systemMessage}. Do not use any other language. Be creative and detailed.`;
    console.log("Full System Prompt:", fullSystemPrompt);

    const fullUserPrompt = `${prompt}\nWrite the story exclusively in ${systemMessage}.`;
    console.log("User Prompt:", fullUserPrompt);

    // Call Groq API to generate the story
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: fullSystemPrompt,
            },
            {
              role: "user",
              content: fullUserPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    // Handle API errors
    if (!groqResponse.ok) {
      const errTxt = await groqResponse.text();
      return res
        .status(500)
        .json({ error: "Error generating story", detail: errTxt });
    }

    const groqData = await groqResponse.json();
    const story = groqData.choices[0].message.content;

    if (!story) {
      return res.status(500).json({ error: "Groq did not return a story" });
    }

    // Return the generated story to the client
    res.json({ story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error", detail: err.message });
  }
});

// ---------------------------
// Endpoint to generate audio
// ---------------------------
app.post("/api/story/audio", async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text) {
      return res
        .status(400)
        .json({ error: "Text is required to generate audio." });
    }

    const voiceId = process.env.VOICE_ID;

    if (!voiceId) {
      return res
        .status(500)
        .json({ error: "VOICE_ID not defined in backend" });
    }

    // Generate audio (returns a ReadableStream)
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    // Convert ReadableStream to Buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Send audio back as MP3
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

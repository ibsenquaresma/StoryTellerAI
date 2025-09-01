import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Inicializa o client do ElevenLabs
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

// ---------------------------
// Endpoint para gerar história
// ---------------------------
app.post("/api/story", async (req, res) => {
  try {
    const { prompt, language = "pt" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `Você é um contador de histórias em ${language}.` },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errTxt = await groqResponse.text();
      return res.status(500).json({ error: "Erro ao gerar história", detail: errTxt });
    }

    const groqData = await groqResponse.json();
    const story = groqData.choices?.[0]?.message?.content?.trim();

    if (!story) {
      return res.status(500).json({ error: "Groq não gerou história" });
    }

    res.json({ story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno", detail: err.message });
  }
});

// ---------------------------
// Endpoint para gerar áudio
// ---------------------------
app.post("/api/story/audio", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Texto é obrigatório para gerar áudio." });
    }

    const voiceId = process.env.VOICE_ID;

    if (!voiceId) {
      return res.status(500).json({ error: "VOICE_ID não definido no backend" });
    }

    // Gera o áudio (retorna um ReadableStream)
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    // Converte ReadableStream para Buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar áudio", detail: err.message });
  }
});

// ---------------------------
// Inicia o servidor
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

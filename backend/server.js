import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Endpoint para gerar história com Groq
app.post("/api/story", async (req, res) => {
  try {
    const { prompt, language = "pt" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
    }

    // 1. Chama a API do Groq
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
          { role: "user", content: prompt }
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

    // Retorna só a história
    res.json({ story });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

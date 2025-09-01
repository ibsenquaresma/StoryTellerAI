import React, { useState } from "react";

export default function StoryGenerator() {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState("pt"); // idioma default
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Gera a história com Groq
  const generateStory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });

      const data = await res.json();
      setStory(data.story || "");
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gera e toca o áudio usando ElevenLabs
  const playAudio = async () => {
    if (!story) return;

    try {
      const res = await fetch(`http://localhost:4000/api/story/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: story }), // remove voice
      });

      if (!res.ok) throw new Error("Erro ao gerar áudio");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      console.error("Erro:", err);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gerador de Histórias 🎭</h1>

      <textarea
        className="w-full border p-2 mb-2 rounded"
        rows={3}
        placeholder="Digite um prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="mb-2">
        <label className="mr-2 font-medium">Idioma:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="pt">Português</option>
          <option value="en">Inglês</option>
          <option value="es">Espanhol</option>
          <option value="fr">Francês</option>
          <option value="de">Alemão</option>
          <option value="it">Italiano</option>
        </select>
      </div>

      <button
        onClick={generateStory}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
      >
        {loading ? "Gerando..." : "Gerar História"}
      </button>

      <div className="mt-4">
        <textarea
          className="w-full border p-2 rounded"
          rows={6}
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <button
          onClick={playAudio}
          disabled={!story}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ▶️ Play
        </button>
      </div>

      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} autoPlay />
        </div>
      )}
    </div>
  );
}

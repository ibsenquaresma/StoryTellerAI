import React, { useState, useRef } from "react";

const StoryGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [story, setStory] = useState<string>("");
  const [language, setLanguage] = useState<string>("pt");
  const [loadingStory, setLoadingStory] = useState<boolean>(false);
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gera a história no idioma selecionado
  const generateStory = async () => {
    setLoadingStory(true);
    try {
      const res = await fetch(`http://localhost:4000/api/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language,
          returnAudio: false,
        }),
      });

      const data = await res.json();
      setStory(data.story || "");
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoadingStory(false);
    }
  };

  // Gera áudio a partir da história
  const playAudio = async () => {
    if (!story) return;
    setLoadingAudio(true);
    setAudioUrl(null);

    try {
      const res = await fetch(`http://localhost:4000/api/story/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: story,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao gerar áudio");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 200);

    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gerador de Histórias 🎭</h1>

      {/* Campo do prompt */}
      <textarea
        className="w-full border p-2 mb-2 rounded"
        rows={3}
        placeholder="Digite um prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {/* Combo de idioma */}
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

      {/* Botão de gerar história */}
      <button
        onClick={generateStory}
        disabled={loadingStory}
        className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
      >
        {loadingStory ? "Gerando..." : "Gerar História"}
      </button>

      {/* História gerada */}
      <div className="mt-4">
        <textarea
          className="w-full border p-2 rounded"
          rows={6}
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>

      {/* Botão de áudio */}
      <div className="mt-4">
        <button
          onClick={playAudio}
          disabled={!story || loadingAudio}
          className="px-4 py-2 bg-green-600 text-white rounded flex items-center justify-center"
        >
          {loadingAudio ? (
            <span className="flex items-center">
              <svg
                className="animate-spin mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Carregando...
            </span>
          ) : (
            "▶️ Play"
          )}
        </button>
      </div>

      {/* Player de áudio */}
      {audioUrl && (
        <div className="mt-4">
          <audio ref={audioRef} controls src={audioUrl} />
        </div>
      )}
    </div>
  );
};

export default StoryGenerator;

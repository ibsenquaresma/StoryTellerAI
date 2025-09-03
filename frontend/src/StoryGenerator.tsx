// Import React and hooks for managing state and refs
import React, { useState, useRef } from "react";
// Import languages list from JSON file
import languages from "../src/config/languages.json";

// Define the functional component
const StoryGenerator: React.FC = () => {
  // State to hold the text prompt entered by the user
  const [prompt, setPrompt] = useState<string>("");

  // State to hold the generated story
  const [story, setStory] = useState<string>("");

  // State to hold the selected language (default: English)
  const [language, setLanguage] = useState<string>("english");

  // State to show loading spinner while story is being generated
  const [loadingStory, setLoadingStory] = useState<boolean>(false);

  // State to show loading spinner while audio is being generated
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);

  // State to store the generated audio file URL
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Reference to the <audio> HTML element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---------------------------
  // Function: Generate story
  // ---------------------------
  const generateStory = async () => {
    setLoadingStory(true);   // Show loading state
    setStory("");            // Clear old story
    setAudioUrl(null);       // Clear old audio
    try {
      // Send POST request to backend API
      const res = await fetch("http://localhost:4000/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,        // User input
          language,      // Selected language
          returnAudio: false,
        }),
      });

      // Parse JSON response
      const data = await res.json();

      if (data.story) {
        setStory(`${data.story}`);
      } else {
        setStory("");
      }
    } catch (err) {
      console.error("Error:", err);
      setStory("");
    } finally {
      setLoadingStory(false);
    }
  };

  // ---------------------------
  // Function: Play generated audio
  // ---------------------------
  const playAudio = async () => {
    if (!story) return;
    setLoadingAudio(true);
    setAudioUrl(null);

    try {
      const textForAudio = story.replace(/^Idioma:.*\n\n/, "");

      const res = await fetch("http://localhost:4000/api/story/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textForAudio }),
      });

      if (!res.ok) throw new Error("Error generating audio");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
      }, 200);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoadingAudio(false);
    }
  };

  // ---------------------------
  // Render component
  // ---------------------------
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Story Generator 🎭</h1>

      {/* Textarea for user prompt */}
      <textarea
        className="w-full border p-2 mb-2 rounded"
        rows={3}
        placeholder="Type a prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {/* Language selector from JSON file */}
      <div className="mb-2">
        <label className="mr-2 font-medium">Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Button to generate story */}
      <button
        onClick={generateStory}
        disabled={loadingStory}
        className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
      >
        {loadingStory ? "Generating..." : "Generate Story"}
      </button>

      {/* Story textarea */}
      <div className="mt-4">
        <textarea
          className="w-full border p-2 rounded"
          rows={8}
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>

      {/* Play audio button */}
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            "▶️ Play"
          )}
        </button>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="mt-4">
          <audio ref={audioRef} controls src={audioUrl} />
        </div>
      )}
    </div>
  );
};

export default StoryGenerator;

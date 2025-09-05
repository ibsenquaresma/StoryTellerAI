# My AI Story

A story generator using **Groq API** and real-time audio with **ElevenLabs**.  

The user types a prompt, the backend generates the story and converts it into an MP3 audio file.  

---

## Technologies

- **Backend:** Node.js + Express  
- **Frontend:** React + TypeScript  
- **External APIs:**  
  - [Groq](https://api.groq.com) → story generation  
  - [ElevenLabs](https://beta.elevenlabs.io/) → text-to-speech conversion  

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/my-ai-story.git
cd my-ai-story
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

3.1 Install required external libraries:
```bash
npm install @elevenlabs/elevenlabs-js node-fetch dotenv cors

```

4. Create a .env file in the backend:
```env
PORT=4000
GROQ_API_KEY=your_groq_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here
GROQ_END_API=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.1-8b-instant
```

5. Running the project
  *  npm run dev
  *  http://localhost:4000 (Back-end)
  *  http://localhost:5173 (Front-end)

## Backend Endpoints

1. Generate story

  * POST /api/story

```
Request body (JSON):

{
  "prompt": "Tell me a story about a warrior in space.",
  "language": "klingon"
}
````
```
Response:

{
  "klingon": "You are a helpful assistant. Always respond in Klingon language (tlhIngan Hol)."
}
```

2. Generate audio
 * POST /api/story/audio

```


Request body (JSON):

{
  "text": "Qapla'! tlhIngan maH." 
}
```
```
Response: An MP3 audio file of the text.

You do not need to send a voice_id; the backend uses the environment variable.
```


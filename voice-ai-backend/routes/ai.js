const express = require("express");
const axios = require("axios");
const multer = require("multer");

const router = express.Router();
const upload = multer();

// Get API keys from environment
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const NEETS_API_KEY = process.env.NEETS_API_KEY;

// Check if API keys are set up properly
if (!DEEPGRAM_API_KEY || !LLM_API_KEY || !NEETS_API_KEY) {
  console.error("Uh-oh! Missing API keys!");
  process.exit(1); // If keys aren't available, stop execution
}

// Route to handle Speech-to-Text (STT)
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Oops, no audio file uploaded." });
    }

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen",
      req.file.buffer,
      {
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": req.file.mimetype || "audio/wav",
        },
      }
    );

    const transcript =
      response.data.results?.channels[0]?.alternatives[0]?.transcript || "";

    if (!transcript) {
      return res
        .status(500)
        .json({ error: "No transcript found, try again later." });
    }

    res.json({ text: transcript });
  } catch (error) {
    console.error("STT Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to transcribe audio. Something went wrong.",
      details: error.response?.data || error.message,
    });
  }
});

// Route to process text using LLM
router.post("/llm", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ error: "No text provided. Please send some text!" });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: text,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${LLM_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.choices?.[0]?.text.trim() || "";
    res.json({ reply: generatedText });
  } catch (error) {
    console.error("LLM Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to process the text. Try again.",
      details: error.response?.data || error.message,
    });
  }
});

// Route for Text-to-Speech (TTS)
router.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Please provide text to convert!" });
    }

    const response = await axios.post(
      "https://api.neets.ai/v1/synthesize", // Endpoint to generate speech
      {
        voice: "alloy", // Could customize voice selection here
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${NEETS_API_KEY}`,
        },
      }
    );

    const audio = response.data.audio; // Assuming audio is base64 encoded
    if (!audio) {
      return res
        .status(500)
        .json({ error: "No audio generated, something went wrong." });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio, "base64")); // Send back audio
  } catch (error) {
    console.error("TTS Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to generate speech. Please try again later.",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;

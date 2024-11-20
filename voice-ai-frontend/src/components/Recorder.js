import React, { useState, useRef } from "react";
import axios from "axios";

function Recorder({ onTranscript, onResponseAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
    } catch (error) {
      setErrorMessage("Microphone access denied. Please allow permissions.");
      console.error("Recording error:", error);
      setIsRecording(false);
    }
  };

  // Stop recording and process audio
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob);

        // Send audio to backend for speech-to-text
        const sttResponse = await axios.post(
          "http://localhost:5000/api/ai/stt",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const text = sttResponse.data.text;
        setTranscript(text);
        onTranscript(text);

        // Process text with LLM (language model)
        const llmResponse = await axios.post(
          "http://localhost:5000/api/ai/llm",
          { text }
        );

        const reply = llmResponse.data.reply;

        // Convert LLM reply to speech
        const ttsResponse = await axios.post(
          "http://localhost:5000/api/ai/tts",
          { text: reply }
        );

        const audioBlobUrl = URL.createObjectURL(
          new Blob([Buffer.from(ttsResponse.data, "base64")], {
            type: "audio/mpeg",
          })
        );
        setAudioUrl(audioBlobUrl);
        onResponseAudio(audioBlobUrl);
      } catch (error) {
        setErrorMessage(error.response?.data?.error || "Processing error.");
        console.error("Processing error:", error);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  return (
    <div className="recorder">
      <button onClick={startRecording} disabled={isRecording || isProcessing}>
        {isRecording ? "Recording..." : "Start Recording"}
      </button>
      <button
        onClick={stopRecording}
        disabled={!isRecording || isProcessing}
        style={{ marginLeft: "10px" }}
      >
        Stop Recording
      </button>

      {isProcessing && <p>Processing audio...</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {transcript && (
        <div>
          <h3>Transcribed Text:</h3>
          <p>{transcript}</p>
        </div>
      )}
      {audioUrl && (
        <audio controls>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

export default Recorder;

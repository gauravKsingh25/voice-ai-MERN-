import React, { useState } from "react";
import Recorder from "./components/Recorder";
import "./styles/App.css";

function App() {
  const [transcript, setTranscript] = useState("");
  const [responseAudio, setResponseAudio] = useState(null);

  return (
    <div className="app">
      <h1>Voice AI Assistant</h1>
      <Recorder
        onTranscript={(text) => setTranscript(text)} // Update transcript
        onResponseAudio={(audio) => setResponseAudio(audio)} // Set audio response
      />
      <div className="output">
        <h2>Transcript:</h2>
        <p>{transcript}</p>
        {responseAudio && (
          <button
            onClick={() => {
              const audio = new Audio(responseAudio); // Play audio when button clicked
              audio.play();
            }}
          >
            Play AI Response
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

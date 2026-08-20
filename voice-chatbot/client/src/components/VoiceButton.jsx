import React, { useState } from "react";

const VoiceButton = ({ onTextReceived, disabled }) => {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    if (disabled || listening) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const text =
        event.results[0][0].transcript;

      console.log("User said:", text);

      onTextReceived(text);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div className={`voice-container ${listening ? "active" : ""}`}>

      {/* Outer animated rings */}
      <div className="voice-ring ring-a"></div>
      <div className="voice-ring ring-b"></div>
      <div className="voice-ring ring-c"></div>

      <button
        className="voice-button"
        onClick={startListening}
        disabled={disabled}
        aria-label="Start voice recognition"
      >

        <div className="mic-glow"></div>

        <div className="mic-icon">

          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="8"
              y="2"
              width="8"
              height="13"
              rx="4"
              stroke="white"
              strokeWidth="1.7"
            />

            <path
              d="M5 11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
            />

            <path
              d="M12 18V22"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
            />

            <path
              d="M9 22H15"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>

        </div>

      </button>

      {listening && (
        <div className="listening-text">
          Listening...
        </div>
      )}

    </div>
  );
};

export default VoiceButton;
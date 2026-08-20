import React, { useState } from "react";
import axios from "axios";
import VoiceButton from "./components/VoiceButton";
import ChatBox from "./components/ChatBox";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

 const speakResponse = (text) => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    setSpeaking(true);
  };

  utterance.onend = () => {
    setSpeaking(false);
  };

  utterance.onerror = () => {
    setSpeaking(false);
  };

  window.speechSynthesis.speak(utterance);
};

const sendMessage = async (text) => {
  if (!text.trim() || loading) return;

  setMessages((prev) => [
    ...prev,
    {
      sender: "user",
      text,
    },
  ]);

  setLoading(true);

  try {
    const response = await axios.post(
      "http://localhost:5000/api/chat",
      {
        message: text,
      }
    );

    console.log("FULL BACKEND RESPONSE:", response.data);

    const reply =
      response.data.answer ||
      response.data.response ||
      response.data.message ||
      "I could not generate a response.";

    // Display AI response
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: reply,
      },
    ]);

    // 🔊 Speak AI response
    speakResponse(reply);

  } catch (error) {
    console.error("Chat error:", error);

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "Sorry, something went wrong.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="app">
      {/* Background effects */}
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>
      <div className="background-glow glow-three"></div>

      <div className="noise"></div>

      {/* Main container */}
      <main className="chat-app">

        {/* Header */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-orb">
              <div className="mini-spark">✦</div>
            </div>

            <div>
              <h2>AskAI</h2>
              <span>AI Assistant</span>
            </div>
          </div>

          <button className="settings-btn">
            <span>⋮</span>
          </button>
        </header>

        {/* Welcome section */}
        {messages.length === 0 && (
          <section className="welcome-section">

            <div className="hero-orb-wrapper">
              <div className="orb-ring ring-one"></div>
              <div className="orb-ring ring-two"></div>
              <div className="orb-ring ring-three"></div>

              <div className="ai-orb">
                <div className="orb-core">
                  <span>✦</span>
                  <span>✦</span>
                  <span>✧</span>
                </div>
              </div>

              <div className="orb-shadow"></div>
            </div>

            <h1>
              How can I
              <br />
              <span>help you?</span>
            </h1>

            <p className="subtitle">
              Ask anything. Speak naturally.
              <br />
              I'm here to help.
            </p>

            {/* Quick actions */}
            <div className="quick-actions">

              <button
                className="action-card"
                onClick={() =>
                  sendMessage("Tell me something interesting")
                }
              >
                <div className="action-icon purple">
                  ✦
                </div>

                <div>
                  <strong>Ask anything</strong>
                  <span>Get an answer</span>
                </div>
              </button>

              <button
                className="action-card"
                onClick={() =>
                  sendMessage("Explain this topic simply")
                }
              >
                <div className="action-icon pink">
                  ◎
                </div>

                <div>
                  <strong>Learn something</strong>
                  <span>Understand better</span>
                </div>
              </button>

              <button
                className="action-card"
                onClick={() =>
                  sendMessage("Give me a creative idea")
                }
              >
                <div className="action-icon blue">
                  ✧
                </div>

                <div>
                  <strong>Get creative</strong>
                  <span>Generate ideas</span>
                </div>
              </button>

              <button
                className="action-card"
                onClick={() =>
                  sendMessage("Search my knowledge base")
                }
              >
                <div className="action-icon violet">
                  ⌕
                </div>

                <div>
                  <strong>Search knowledge</strong>
                  <span>Find information</span>
                </div>
              </button>

            </div>
          </section>
        )}

        {/* Chat */}
        {messages.length > 0 && (
          <section className="conversation">
            <ChatBox messages={messages} loading={loading} />
          </section>
        )}

        {/* Voice area */}
        <section className="voice-section">

          {loading && (
            <div className="thinking">
              <span></span>
              <span></span>
              <span></span>
              AI is thinking...
            </div>
          )}

          <VoiceButton
            onTextReceived={sendMessage}
            disabled={loading}
          />

          <p className="voice-hint">
            {loading
              ? "Processing your question..."
              : "Tap the microphone and speak"}
          </p>
        </section>

        {/* Bottom */}
        <footer className="footer">
          <span>Powered by RAG</span>

          <div className="status">
            <span className="status-dot"></span>
            AI Online
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;
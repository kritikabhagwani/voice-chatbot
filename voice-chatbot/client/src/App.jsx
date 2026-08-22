import React, { useState, useEffect } from "react";
import axios from "axios";
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from "@clerk/clerk-react";
import VoiceButton from "./components/VoiceButton";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const { getToken, isSignedIn } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetchChats();
    }
  }, [isSignedIn]);

  const fetchChats = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const loadChat = async (chatId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(\`http://localhost:5000/api/chat/\${chatId}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (response.data.success) {
        setMessages(response.data.messages);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);
        setLimitReached(response.data.chat.messageCount >= 80);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setLimitReached(false);
    setIsSidebarOpen(false);
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading || limitReached) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      const token = await getToken();
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: text,
        chatId: currentChatId,
      }, {
        headers: { Authorization: \`Bearer \${token}\` }
      });

      console.log("FULL BACKEND RESPONSE:", response.data);

      if (response.data.limitReached) {
         setLimitReached(true);
      }

      const reply = response.data.answer || "I could not generate a response.";

      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      speakResponse(reply);

      if (!currentChatId) {
        setCurrentChatId(response.data.chatId);
        fetchChats(); // Refresh list to show new chat
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (error.response && error.response.data.limitReached) {
        setLimitReached(true);
        setMessages((prev) => [...prev, { sender: "ai", text: "Chat limit reached. Please start a new chat." }]);
      } else {
        setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, something went wrong." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <SignedOut>
        <div className="signin-container">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <Sidebar 
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={loadChat}
          onNewChat={startNewChat}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

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

            <div className="topbar-actions">
              <UserButton />
              <button className="settings-btn" onClick={() => setIsSidebarOpen(true)}>
                <span>⋮</span>
              </button>
            </div>
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
            disabled={loading || limitReached}
          />

          <p className="voice-hint">
            {limitReached 
              ? "Chat limit reached. Start a new chat."
              : loading
              ? "Processing your question..."
              : "Tap the microphone and speak"}
          </p>
        </section>

        {/* Bottom */}
        <footer className="footer">
          <span>Powered by RAG & Vector Memory</span>

          <div className="status">
            <span className="status-dot"></span>
            AI Online
          </div>
        </footer>

      </main>
      </SignedIn>
    </div>
  );
}

export default App;
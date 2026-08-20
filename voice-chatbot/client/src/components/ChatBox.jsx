import React, { useEffect, useRef } from "react";

const ChatBox = ({ messages, loading }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <div className="messages">

      {messages.map((message, index) => (
        <div
          key={index}
          className={`message-row ${message.sender}`}
        >

          {message.sender === "ai" && (
            <div className="message-avatar">
              ✦
            </div>
          )}

          <div className="message-content">

            <span className="message-label">
              {message.sender === "user" ? "You" : "AskAI"}
            </span>

            <div className="message-bubble">
              {message.text}
            </div>

          </div>

        </div>
      ))}

      {loading && (
        <div className="message-row ai">

          <div className="message-avatar">
            ✦
          </div>

          <div className="message-content">

            <span className="message-label">
              AskAI
            </span>

            <div className="message-bubble typing">

              <span></span>
              <span></span>
              <span></span>

            </div>

          </div>

        </div>
      )}

      <div ref={chatEndRef}></div>

    </div>
  );
};

export default ChatBox;
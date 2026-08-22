import React from 'react';
import './Sidebar.css'; // We'll add some styles to App.css or a new Sidebar.css

const Sidebar = ({ chats, currentChatId, onSelectChat, onNewChat, isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>+</span> New Chat
        </button>
        <button className="close-sidebar-btn" onClick={toggleSidebar}>×</button>
      </div>
      <div className="chat-list">
        {chats.map(chat => (
          <div 
            key={chat.chatId} 
            className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.chatId)}
          >
            <div className="chat-item-title">{chat.title}</div>
            <div className="chat-item-meta">
              {chat.messageCount} msgs {chat.isSummarized ? '(Summarized)' : ''}
            </div>
          </div>
        ))}
        {chats.length === 0 && <div className="no-chats">No previous chats</div>}
      </div>
    </div>
  );
};

export default Sidebar;

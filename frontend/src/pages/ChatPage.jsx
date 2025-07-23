import React from 'react';
import './ChatPage.css';

export default function ChatPage() {
  return (
    <div className="chat-page-container">
      <aside className="chat-sidebar">
        <div className="chat-tabs">
          <button className="chat-tab active">De cumpărat</button>
          <button className="chat-tab">De vândut</button>
        </div>
        <div className="chat-section-label">NECITITE</div>
        <div className="chat-empty-state">
          <span role="img" aria-label="party">🎉</span> Ești la zi!
        </div>
        <div className="chat-section-label">CITITE</div>
        <div className="chat-conversation-list">
          <div className="chat-conversation-item read">
            <img className="chat-avatar" src="https://randomuser.me/api/portraits/men/32.jpg" alt="Ciprian" />
            <div className="chat-conversation-info">
              <div className="chat-conversation-name">Ciprian</div>
              <div className="chat-conversation-message">Pregătire/meditații fizică bac<br/>Ok..</div>
            </div>
            <div className="chat-conversation-time">16.05</div>
            <div className="chat-conversation-saved" title="Salvat">
              <svg width="18" height="18" fill="none" stroke="#355070" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"/></svg>
            </div>
          </div>
        </div>
      </aside>
      <main className="chat-main">
        <div className="chat-empty-main">
          <div className="chat-empty-icon">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="60" fill="#E3EDFF"/><circle cx="85" cy="85" r="40" fill="#407BFF"/><path d="M60 80c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z" fill="#D6E4FF"/><circle cx="60" cy="60" r="10" fill="#00394C"/><path d="M65 65c-2.5 2.5-7.5 2.5-10 0" stroke="#00394C" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="chat-empty-text">Selectează o conversație pentru a o citi</div>
        </div>
      </main>
    </div>
  );
}

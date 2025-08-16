import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ userName }) => {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator-content">
        <span className="typing-user">{userName} scrie</span>
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

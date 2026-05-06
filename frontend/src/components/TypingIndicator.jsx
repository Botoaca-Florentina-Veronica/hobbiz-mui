import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="ti-wrapper">
      <div className="ti-bubble">
        <span className="ti-dot" />
        <span className="ti-dot" />
        <span className="ti-dot" />
      </div>
    </div>
  );
};

export default TypingIndicator;

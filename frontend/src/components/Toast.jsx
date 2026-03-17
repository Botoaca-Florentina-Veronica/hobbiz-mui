import React, { useEffect, useState } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', visible, onClose, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false);
  const durationMs = Number.isFinite(duration) ? duration : 3000;

  useEffect(() => {
    if (!visible) {
      setIsExiting(false);
      return;
    }

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, durationMs);

    const closeTimer = setTimeout(onClose, durationMs + 300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [visible, onClose, durationMs]);

  if (!visible && !isExiting) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2l4-4" />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'info':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 220);
  };

  return (
    <div
      className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      style={{ '--toast-duration': `${durationMs}ms` }}
      role="status"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={handleManualClose}
          aria-label="Close notification"
        >
          x
        </button>
      </div>
      <div className="toast-progress" />
    </div>
  );
}

import React from 'react';
import AddIcon from '@mui/icons-material/Add';

export default function FooterPublishButton({ onClick, active }) {
  return (
    <div
      className="footer-icon footer-publish"
      onClick={onClick}
      aria-label="Publică un anunț"
      style={{ position: 'relative' }}
    >
      <AddIcon style={{ fontSize: 28, strokeWidth: 2.2 }} />
      <span
        className="footer-publish-label"
        style={active ? { opacity: 1, height: 'auto', pointerEvents: 'auto' } : {}}
      >
        Publică
      </span>
    </div>
  );
}

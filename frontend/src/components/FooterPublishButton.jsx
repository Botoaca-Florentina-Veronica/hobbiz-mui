import React from 'react';
import AddIcon from '@mui/icons-material/Add';

export default function FooterPublishButton({ onClick, active }) {
  return (
    <div
      className={`footer-icon footer-publish ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label="Publică un anunț"
    >
      <div className="footer-publish-icon">
        <AddIcon style={{ fontSize: 20, strokeWidth: 3 }} />
      </div>
      <span>Vinde</span>
    </div>
  );
}

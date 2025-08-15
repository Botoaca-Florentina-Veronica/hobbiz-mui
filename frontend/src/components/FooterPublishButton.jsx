import React from 'react';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';

export default function FooterPublishButton({ onClick, active }) {
  return (
    <div
      className={`footer-icon footer-publish ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label="Publică un anunț"
    >
      <div className="footer-publish-icon">
        <SellOutlinedIcon className="footer-publish-svg" />
      </div>
      <span>Vinde</span>
    </div>
  );
}

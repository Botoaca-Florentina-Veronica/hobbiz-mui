import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Box, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Gavel, Policy, PrivacyTip } from '@mui/icons-material';
import './InformatiiLegale.css';

export default function InformatiiLegale() {
  const navigate = useNavigate();
  return (
    <div className="informatii-legale">
      <div className="informatii-legale__content">
        <ul className="account-mobile__menu">
          <li>
            <button className="account-mobile__menu-btn" onClick={() => navigate('/termeni')}>
              <span className="account-mobile__menu-icon"><Gavel /></span>
              <span className="account-mobile__menu-label">Termeni și condiții</span>
            </button>
          </li>
          <li>
            <button className="account-mobile__menu-btn" onClick={() => navigate('/cookie')}>
              <span className="account-mobile__menu-icon"><Policy /></span>
              <span className="account-mobile__menu-label">Cookie policy</span>
            </button>
          </li>
          <li>
            <button className="account-mobile__menu-btn" onClick={() => navigate('/confidentialitate')}>
              <span className="account-mobile__menu-icon"><PrivacyTip /></span>
              <span className="account-mobile__menu-label">Politica de confidențialitate</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

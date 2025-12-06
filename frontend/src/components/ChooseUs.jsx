import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { FiSmartphone, FiUsers, FiTrendingUp, FiLayout, FiShield, FiMessageCircle, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './ChooseUs.css';

const icons = {
  1: <FiSmartphone />,
  2: <FiUsers />,
  3: <FiTrendingUp />,
  4: <FiLayout />,
  5: <FiShield />,
  6: <FiMessageCircle />
};

export default function ChooseUs() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const items = [1, 2, 3, 4, 5, 6];

  return (
    <section className="choose-us-section">
      <div className="choose-us-container">
        <Typography variant="h2" className="choose-us-title">
          {t('chooseUs.title')}
        </Typography>
        <Typography 
          variant="subtitle1" 
          className="choose-us-subtitle"
          sx={{ 
            textAlign: 'center !important', 
            display: 'block !important',
            width: '100% !important',
            marginLeft: 'auto !important',
            marginRight: 'auto !important'
          }}
        >
          {t('chooseUs.subtitle')}
        </Typography>

        <div className="choose-us-grid">
          {items.map((item) => (
            <div key={item} className="choose-us-card">
              <div className="choose-us-icon-wrapper">
                {icons[item]}
              </div>
              <div className="choose-us-content">
                <h3 className="choose-us-card-title">
                  {t(`chooseUs.items.${item}.title`)}
                </h3>
                <p className="choose-us-card-desc">
                  {t(`chooseUs.items.${item}.desc`)}
                </p>
                <div className="choose-us-link" onClick={() => navigate('/about')}>
                  {t('chooseUs.seeMore')} <FiChevronRight />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

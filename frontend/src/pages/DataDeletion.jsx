import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './DataDeletion.css';

const DataDeletion = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);
  
  return (
    <div className="data-deletion">
      <div className="data-deletion__container">
        {/* Mobile header: back + title */}
        <div className="mobile-header">
          <IconButton
            onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
            className="mobile-back-btn"
            disableRipple
            disableFocusRipple
            aria-label={t('common.back')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title">{t('dataDeletion.title')}</Typography>
        </div>
        
        <div className="data-deletion__header">
          <span className="data-deletion__icon" role="img" aria-label="trash">🗑️</span>
          <h1>{t('dataDeletion.title')}</h1>
          <p className="data-deletion__date">{t('dataDeletion.subtitle')}</p>
        </div>

        <div className="data-deletion__intro">
          <div className="data-deletion__intro-content">
            <span className="data-deletion__intro-icon" role="img" aria-label="info">ℹ️</span>
            <div>
              <strong>{t('dataDeletion.intro.title')}</strong>
              <p>{t('dataDeletion.intro.text')}</p>
            </div>
          </div>
        </div>

        {/* What data will be deleted */}
        <div className="data-deletion__content">
          <section>
            <h2>{t('dataDeletion.s1.title')}</h2>
            <p>{t('dataDeletion.s1.intro')}</p>
            <ul>
              {t('dataDeletion.s1.list', { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="note">{t('dataDeletion.s1.note')}</p>
          </section>
        </div>

        {/* How to delete your data */}
        <div className="data-deletion__content">
          <section>
            <h2>{t('dataDeletion.s2.title')}</h2>
            <p>{t('dataDeletion.s2.intro')}</p>
            
            <div className="step-card">
              <div className="step-header">
                <span className="step-number">A</span>
                <h3>{t('dataDeletion.s2.optionA.title')}</h3>
              </div>
              <ul>
                {t('dataDeletion.s2.optionA.steps', { returnObjects: true }).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="step-card">
              <div className="step-header">
                <span className="step-number">B</span>
                <h3>{t('dataDeletion.s2.optionB.title')}</h3>
              </div>
              <p>{t('dataDeletion.s2.optionB.intro')}</p>
              <ul>
                {t('dataDeletion.s2.optionB.steps', { returnObjects: true }).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
              <p className="note">{t('dataDeletion.s2.optionB.note')}</p>
            </div>

            <div className="step-card">
              <div className="step-header">
                <span className="step-number">C</span>
                <h3>{t('dataDeletion.s2.optionC.title')}</h3>
              </div>
              <p>{t('dataDeletion.s2.optionC.intro')}</p>
              <ul>
                {t('dataDeletion.s2.optionC.steps', { returnObjects: true }).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
              <p className="note">{t('dataDeletion.s2.optionC.note')}</p>
            </div>
          </section>
        </div>

        {/* Timeline */}
        <div className="data-deletion__content">
          <section>
            <h2>{t('dataDeletion.s3.title')}</h2>
            <p>{t('dataDeletion.s3.intro')}</p>
            
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>{t('dataDeletion.s3.day0.title')}</h3>
                  <p>{t('dataDeletion.s3.day0.text')}</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>{t('dataDeletion.s3.day7.title')}</h3>
                  <p>{t('dataDeletion.s3.day7.text')}</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h3>{t('dataDeletion.s3.day30.title')}</h3>
                  <p>{t('dataDeletion.s3.day30.text')}</p>
                </div>
              </div>
            </div>
            
            <p className="note">{t('dataDeletion.s3.recovery')}</p>
          </section>
        </div>

        {/* Important considerations */}
        <div className="data-deletion__content">
          <section>
            <h2>{t('dataDeletion.s4.title')}</h2>
            
            <h3>{t('dataDeletion.s4.retained.title')}</h3>
            <p>{t('dataDeletion.s4.retained.intro')}</p>
            <ul>
              {t('dataDeletion.s4.retained.list', { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            
            <h3>{t('dataDeletion.s4.permanent.title')}</h3>
            <p>{t('dataDeletion.s4.permanent.intro')}</p>
            <ul>
              {t('dataDeletion.s4.permanent.list', { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* Need help */}
        <div className="data-deletion__content">
          <section>
            <h2>{t('dataDeletion.s5.title')}</h2>
            <p>
              {t('dataDeletion.s5.p1')} <a href="mailto:team.hobbiz@gmail.com">team.hobbiz@gmail.com</a>. {t('dataDeletion.s5.response')}
            </p>
            <p>{t('dataDeletion.s5.p2')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;

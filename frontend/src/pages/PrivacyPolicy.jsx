import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
  <div className="privacy-policy">
    <div className="privacy-policy__container">
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
        <Typography variant="h5" className="mobile-header-title">{t('privacy.title')}</Typography>
      </div>
      <div className="privacy-policy__header">
        <span className="privacy-policy__icon" role="img" aria-label="shield">🛡️</span>
        <h1>{t('privacy.title')}</h1>
        <p className="privacy-policy__date">{t('privacy.lastUpdated')}</p>
      </div>

      <div className="privacy-policy__intro">
        <div className="privacy-policy__intro-content">
          <span className="privacy-policy__intro-icon" role="img" aria-label="info">ℹ️</span>
          <div>
            <strong>{t('privacy.intro.title')}</strong>
            <p>
              {t('privacy.intro.text')}
            </p>
          </div>
        </div>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s1.title')}</h2>
          <p>
            {t('privacy.s1.p1')}
          </p>
          <p>
            {t('privacy.s1.p2')}
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s2.title')}</h2>
          
          <h3>{t('privacy.s2.h1')}</h3>
          <p>
            {t('privacy.s2.p1')}
          </p>
          <p>
            {t('privacy.s2.p2')}
          </p>
          
          <h3>{t('privacy.s2.h2')}</h3>
          <p>
            {t('privacy.s2.p3')}
          </p>
          <p>
            {t('privacy.s2.p4')}
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s3.title')}</h2>
          <p>
            {t('privacy.s3.intro')}
          </p>
          
          <h3>{t('privacy.s3.h1')}</h3>
          <p>
            {t('privacy.s3.p1')}
          </p>
          
          <h3>{t('privacy.s3.h2')}</h3>
          <p>
            {t('privacy.s3.p2')}
          </p>
          
          <h3>{t('privacy.s3.h3')}</h3>
          <p>
            {t('privacy.s3.p3')}
          </p>
          
          <h3>{t('privacy.s3.h4')}</h3>
          <p>
            {t('privacy.s3.p4')}
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s4.title')}</h2>
          <p>
            {t('privacy.s4.intro')}
          </p>
          
          <p>
            <strong>{t('privacy.s4.encryption.title')}</strong> {t('privacy.s4.encryption.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s4.access.title')}</strong> {t('privacy.s4.access.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s4.testing.title')}</strong> {t('privacy.s4.testing.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s4.policies.title')}</strong> {t('privacy.s4.policies.text')}
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s5.title')}</h2>
          
          <p>
              {t('privacy.s5.intro')}
          </p>

          <h3>{t('privacy.s5.arch.title')}</h3>
          <p>
              {t('privacy.s5.arch.intro')}
          </p>
        
        <p>
            <strong>{t('privacy.s5.arch.perimeter.title')}</strong> {t('privacy.s5.arch.perimeter.text')}
        </p>
        
        <p>
            <strong>{t('privacy.s5.arch.app.title')}</strong> {t('privacy.s5.arch.app.text')}
        </p>
        
        <p>
            <strong>{t('privacy.s5.arch.access.title')}</strong> {t('privacy.s5.arch.access.text')}
        </p>

        <h3>{t('privacy.s5.storage.title')}</h3>
        <p>
            <strong>{t('privacy.s5.storage.encryption.title')}</strong> {t('privacy.s5.storage.encryption.text')}
        </p>
        
        <p>
            <strong>{t('privacy.s5.storage.backup.title')}</strong> {t('privacy.s5.storage.backup.text')}
        </p>

        <h3>{t('privacy.s5.management.title')}</h3>
        <p>
            <strong>{t('privacy.s5.management.testing.title')}</strong> {t('privacy.s5.management.testing.text')}
        </p>
        
        <p>
            <strong>{t('privacy.s5.management.response.title')}</strong> {t('privacy.s5.management.response.text')}
        </p>

        <h3>{t('privacy.s5.awareness.title')}</h3>
        <p>
            <strong>{t('privacy.s5.awareness.recommendations.title')}</strong> {t('privacy.s5.awareness.recommendations.text')}
        </p>
        
        <ul>
            {t('privacy.s5.awareness.list', { returnObjects: true }).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
        </ul>
        
        <p>
            <strong>{t('privacy.s5.awareness.team.title')}</strong> {t('privacy.s5.awareness.team.text')}
        </p>

        <h3>{t('privacy.s5.certifications.title')}</h3>
        <p>
            {t('privacy.s5.certifications.intro')}
        </p>
        
        <ul>
            {t('privacy.s5.certifications.list', { returnObjects: true }).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
        </ul>
        
        <p>
            {t('privacy.s5.certifications.contact')} <a href="mailto:team.hobbiz@gmail.com">team.hobbiz@gmail.com</a>.
        </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s6.title')}</h2>
          <p>
            {t('privacy.s6.intro')}
          </p>
          
          <p>
            <strong>{t('privacy.s6.access.title')}</strong> {t('privacy.s6.access.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s6.rectification.title')}</strong> {t('privacy.s6.rectification.text')}
          </p>

          <p>
            <strong>{t('privacy.s6.erasure.title')}</strong> {t('privacy.s6.erasure.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s6.restriction.title')}</strong> {t('privacy.s6.restriction.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s6.objection.title')}</strong> {t('privacy.s6.objection.text')}
          </p>
          
          <p>
            {t('privacy.s6.contact')} <a href="mailto:team.hobbiz@gmail.com">team.hobbiz@gmail.com</a>. {t('privacy.s6.response')}
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>{t('privacy.s7.title')}</h2>
          <p>
            {t('privacy.s7.intro')}
          </p>
          
          <p>
            <strong>{t('privacy.s7.operator.title')}</strong> {t('privacy.s7.operator.text')}
          </p>
          
          <p>
            <strong>{t('privacy.s7.dpo.title')}</strong> {t('privacy.s7.dpo.text')} <a href="mailto:team.hobbiz@gmail.com">team.hobbiz@gmail.com</a> {t('privacy.s7.dpo.purpose')}
          </p>
          
          <p>
            <strong>{t('privacy.s7.authority.title')}</strong> {t('privacy.s7.authority.text')}
          </p>
        </section>
      </div>
    </div>
  </div>
  );
};

export default PrivacyPolicy;
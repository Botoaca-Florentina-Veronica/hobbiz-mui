import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './TermsConditions.css';

const TermsConditions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const handleBack = () => {
    try {
      // Prefer history back when available inside SPA navigation
      if (window.history && window.history.length > 1) {
        navigate(-1);
        return;
      }
      // Fallback: same-origin referrer path (handles full reload entry)
      const ref = document.referrer;
      if (ref) {
        const refUrl = new URL(ref, window.location.href);
        if (refUrl.origin === window.location.origin) {
          navigate(refUrl.pathname + refUrl.search + refUrl.hash);
          return;
        }
      }
    } catch (_) {}
    // Default fallback: go home
    navigate('/');
  };
  return (
  <div className="terms-conditions">
    <div className="terms-conditions__container">
      {/* Mobile header: back + title */}
      <div className="mobile-header">
        <IconButton
          onClick={handleBack}
          className="mobile-back-btn"
          disableRipple
          disableFocusRipple
          aria-label={t('common.back')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="mobile-header-title">{t('terms.title')}</Typography>
      </div>
      <div className="terms-conditions__header">
        <span className="terms-conditions__icon" role="img" aria-label="contract">📝</span>
        <h1>{t('terms.title')}</h1>
        <p className="terms-conditions__date">{t('terms.lastUpdated')}</p>
      </div>

      <div className="terms-conditions__intro">
        <div className="terms-conditions__intro-content">
          <span className="terms-conditions__intro-icon" role="img" aria-label="info">ℹ️</span>
          <div>
            <strong>{t('terms.intro.title')}</strong>
            <p>
              {t('terms.intro.text')}
            </p>
          </div>
        </div>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s1.title')}</h2>
          <p>
            {t('terms.s1.p1')}
          </p>
          <p>
            {t('terms.s1.p2')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s2.title')}</h2>
          
          <h3>{t('terms.s2.h1')}</h3>
          <p>
            {t('terms.s2.p1')}
          </p>
          <p>
            {t('terms.s2.p2')}
          </p>
          
          <h3>{t('terms.s2.h2')}</h3>
          <p>
            {t('terms.s2.p3')}
          </p>
          <p>
            {t('terms.s2.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s3.title')}</h2>
          
          <h3>{t('terms.s3.h1')}</h3>
          <p>
            {t('terms.s3.p1')}
          </p>
          <p>
            {t('terms.s3.p2')}
          </p>
          
          <h3>{t('terms.s3.h2')}</h3>
          <p>
            {t('terms.s3.p3')}
          </p>
          <p>
            {t('terms.s3.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s4.title')}</h2>
          
          <h3>{t('terms.s4.h1')}</h3>
          <p>
            {t('terms.s4.p1')}
          </p>
          <p>
            {t('terms.s4.p2')}
          </p>
          
          <h3>{t('terms.s4.h2')}</h3>
          <p>
            {t('terms.s4.p3')}
          </p>
          <p>
            {t('terms.s4.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s5.title')}</h2>
          
          <h3>{t('terms.s5.h1')}</h3>
          <p>
            {t('terms.s5.p1')}
          </p>
          <p>
            {t('terms.s5.p2')}
          </p>
          
          <h3>{t('terms.s5.h2')}</h3>
          <p>
            {t('terms.s5.p3')}
          </p>
          <p>
            {t('terms.s5.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s6.title')}</h2>
          
          <h3>{t('terms.s6.h1')}</h3>
          <p>
            {t('terms.s6.p1')}
          </p>
          <p>
            {t('terms.s6.p2')}
          </p>
          
          <h3>{t('terms.s6.h2')}</h3>
          <p>
            {t('terms.s6.p3')}
          </p>
          <p>
            {t('terms.s6.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s7.title')}</h2>
          
          <h3>{t('terms.s7.h1')}</h3>
          <p>
            {t('terms.s7.p1')}
          </p>
          <p>
            {t('terms.s7.p2')}
          </p>
          
          <h3>{t('terms.s7.h2')}</h3>
          <p>
            {t('terms.s7.p3')}
          </p>
          <p>
            {t('terms.s7.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s8.title')}</h2>
          
          <h3>{t('terms.s8.h1')}</h3>
          <p>
            {t('terms.s8.p1')}
          </p>
          <p>
            {t('terms.s8.p2')}
          </p>
          
          <h3>{t('terms.s8.h2')}</h3>
          <p>
            {t('terms.s8.p3')}
          </p>
          <p>
            {t('terms.s8.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s9.title')}</h2>
          
          <h3>{t('terms.s9.h1')}</h3>
          <p>
            {t('terms.s9.p1')}
          </p>
          <p>
            {t('terms.s9.p2')}
          </p>
          
          <h3>{t('terms.s9.h2')}</h3>
          <p>
            {t('terms.s9.p3')}
          </p>
          <p>
            {t('terms.s9.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>{t('terms.s10.title')}</h2>
          
          <h3>{t('terms.s10.h1')}</h3>
          <p>
            {t('terms.s10.p1')}
          </p>
          <p>
            {t('terms.s10.p2')}
          </p>
          
          <h3>{t('terms.s10.h2')}</h3>
          <p>
            {t('terms.s10.p3')}
          </p>
          <p>
            {t('terms.s10.p4')}
          </p>
        </section>
      </div>

      <div className="terms-conditions__footer">
        <p>
          {t('terms.footer')}
        </p>
      </div>
    </div>
  </div>
  );
};

export default TermsConditions;

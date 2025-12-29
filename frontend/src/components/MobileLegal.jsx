import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Compact mobile-only legal links inspired by the provided screenshot.
// Uses native <details> for accessible collapsible groups.
export default function MobileLegal() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const go = (e, to) => {
    e.preventDefault();
    // Navigate in SPA
    navigate(to);

    // If already on the same path, attempt to scroll immediately
    try {
      if (typeof window !== 'undefined' && window.location && window.location.pathname === to) {
        window.scrollTo(0, 0);
        const d = document.scrollingElement || document.documentElement || document.body;
        if (d) d.scrollTop = 0;
      }
    } catch (err) {
      // ignore
    }

    // On small screens, re-try scrolling after a short delay to handle route render timing
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      // immediate attempt
      try {
        window.scrollTo(0, 0);
        const d = document.scrollingElement || document.documentElement || document.body;
        if (d) d.scrollTop = 0;
      } catch (err) {}

      setTimeout(() => {
        try {
          const scEl = document.scrollingElement || document.documentElement || document.body;
          if (scEl && typeof scEl.scrollTo === 'function') scEl.scrollTo({ top: 0, behavior: 'smooth' });

          // Some pages use an inner scroll container; try common selectors
          const main = document.querySelector('.privacy-policy__container, .content, .ma-scroll-view, .add-announcement-form, .homepage, .main-stage');
          if (main && typeof main.scrollTo === 'function') {
            main.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (err) {
          // ignore scrolling errors
        }
      }, 200);
    }
  };

  return (
    <div className="mobile-legal" role="navigation" aria-label={`${t('legal.usefulLinks')} și informații legale`}>
      <section className="mobile-legal__group">
        <h4 className="mobile-legal__title">{t('legal.usefulLinks')}</h4>
        <ul className="mobile-legal__list">
          <li><a href="/despre" onClick={(e)=>go(e,'/despre')}>{t('legal.about')}</a></li>
          <li><a href="/contact" onClick={(e)=>go(e,'/contact')}>{t('legal.contact')}</a></li>
          <li><a href="/cum-functioneaza" onClick={(e)=>go(e,'/cum-functioneaza')}>{t('legal.howItWorks')}</a></li>
        </ul>
      </section>

  <section className="mobile-legal__group">
        <h4 className="mobile-legal__title">{t('legal.legal')}</h4>
        <ul className="mobile-legal__list">
          <li><a href="/termeni" onClick={(e)=>go(e,'/termeni')}>{t('legal.terms')}</a></li>
          <li><a href="/confidentialitate" onClick={(e)=>go(e,'/confidentialitate')}>{t('legal.privacyPolicy')}</a></li>
          <li><a href="/cookie" onClick={(e)=>go(e,'/cookie')}>{t('legal.cookiePolicy')}</a></li>
        </ul>
      </section>

    </div>
  );
}

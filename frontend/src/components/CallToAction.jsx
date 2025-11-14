import './CallToAction.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CallToAction() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className="hole-action">
      <div className="call-to-action">
        <h3>HOBBIZ</h3>
        <p>{t('cta.tagline')}</p>
        <button className="second-button sign-up-button" onClick={() => navigate('/signup')}>
          {t('cta.button')}
        </button>
      </div>
    </div>
  );
}
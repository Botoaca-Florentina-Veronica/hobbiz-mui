import './CallToAction.css';
import { useNavigate } from 'react-router-dom';

export default function CallToAction() {
  const navigate = useNavigate();
  return (
    <div className="hole-action">
      <div className="call-to-action">
        <h3>HOBBIZ</h3>
        <p>Locul unde pasiunea ta se poate transforma într-o afacere,
          un side-hustle sau chiar o a doua sursă de venit.
        </p>
        <button className="second-button sign-up-button" onClick={() => navigate('/signup')}>Sign up</button>
      </div>
    </div>
  )
}
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './CookiePolicy.css';

export default function CookiePolicy() {
  return (
    <>
      <Header />
      <div className="cookie-policy-page">
        <div className="cookie-policy-container">
          {/* Hero Section */}
          <div className="cookie-policy-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🍪</span>
              <span>Politica Cookie-urilor</span>
            </div>
            <h1 className="hero-title">
              Înțelege cum folosim <span className="highlight">cookie-urile</span>
            </h1>
            <p className="hero-description">
              Această pagină explică ce sunt cookie-urile, cum le folosim pe site-ul nostru și cum poți controla setările acestora pentru o experiență personalizată.
            </p>
          </div>

          {/* Main Content */}
          <div className="cookie-policy-content">
            <section className="policy-section">
              <h2>Ce sunt cookie-urile?</h2>
              <p>
                Cookie-urile sunt fișiere text mici care sunt plasate pe dispozitivul tău (computer, telefon mobil sau tabletă) 
                atunci când vizitezi un site web. Acestea sunt procesate și stocate de browser-ul tău web și ne ajută să îți 
                oferim o experiență mai bună pe site-ul nostru.
              </p>
              <p>
                Cookie-urile sunt inofensive în sine și servesc funcții cruciale pentru site-uri web. Ele pot fi vizualizate 
                și șterse cu ușurință din setările browser-ului tău.
              </p>
            </section>

            <section className="policy-section">
              <h2>Tipuri de cookie-uri pe care le folosim</h2>
              
              <div className="cookie-type">
                <h3>1. Cookie-uri strict necesare</h3>
                <p>
                  Aceste cookie-uri sunt esențiale pentru ca tu să poți naviga pe site-ul web și să folosești funcțiile sale, 
                  cum ar fi accesarea zonelor sigure ale site-ului. Cookie-urile care permit magazinelor web să îți 
                  păstreze articolele în coș în timp ce faci cumpărături online sunt un exemplu de cookie-uri strict necesare.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Autentificare</span>
                  <span className="cookie-tag">Sesiune utilizator</span>
                  <span className="cookie-tag">Preferințe site</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>2. Cookie-uri de preferințe</h3>
                <p>
                  Cunoscute și ca "cookie-uri de funcționalitate", aceste cookie-uri permit unui site web să își 
                  amintească alegerile pe care le-ai făcut în trecut, cum ar fi limba pe care o preferi, regiunea 
                  pentru care dorești rapoarte meteo sau numele de utilizator și parola pentru autentificare automată.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Limba preferată</span>
                  <span className="cookie-tag">Tema (light/dark)</span>
                  <span className="cookie-tag">Regiunea</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>3. Cookie-uri de statistici</h3>
                <p>
                  Cunoscute și ca "cookie-uri de performanță", aceste cookie-uri colectează informații despre 
                  modul în care folosești un site web, cum ar fi paginile pe care le-ai vizitat și linkurile 
                  pe care le-ai apăsat. Niciuna dintre aceste informații nu poate fi folosită pentru a te identifica. 
                  Totul este agregat și, prin urmare, anonimizat.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Google Analytics</span>
                  <span className="cookie-tag">Statistici vizite</span>
                  <span className="cookie-tag">Îmbunătățiri UX</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>4. Cookie-uri de marketing</h3>
                <p>
                  Aceste cookie-uri urmăresc activitatea ta online pentru a ajuta advertiserii să livreze 
                  publicitate mai relevantă sau să limiteze de câte ori vezi o reclamă. Aceste cookie-uri 
                  pot împărtăși acele informații cu alte organizații sau advertiseri.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Publicitate țintită</span>
                  <span className="cookie-tag">Retargeting</span>
                  <span className="cookie-tag">Analize comportament</span>
                </div>
              </div>
            </section>

            <section className="policy-section">
              <h2>De ce folosim cookie-uri?</h2>
              <div className="reasons-grid">
                <div className="reason-card">
                  <div className="reason-icon">🔐</div>
                  <h4>Securitate și autentificare</h4>
                  <p>Pentru a-ți menține sesiunea sigură și pentru a-ți permite să rămâi autentificat pe site.</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">⚙️</div>
                  <h4>Funcționalitate</h4>
                  <p>Pentru a-ți aminti preferințele (limba, tema, regiunea) și pentru a personaliza experiența ta.</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">📊</div>
                  <h4>Analiză și îmbunătățiri</h4>
                  <p>Pentru a înțelege cum este folosit site-ul și pentru a îmbunătăți serviciile noastre.</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">🎯</div>
                  <h4>Conținut relevant</h4>
                  <p>Pentru a-ți afișa anunțuri și conținut relevant bazat pe interesele tale.</p>
                </div>
              </div>
            </section>

            <section className="policy-section">
              <h2>Cum să gestionezi cookie-urile</h2>
              <p>
                Poți controla și/sau șterge cookie-urile după cum dorești. Poți șterge toate cookie-urile 
                care sunt deja pe computerul tău și poți seta majoritatea browserelor să le împiedice să fie plasate.
              </p>
              
              <div className="browser-guides">
                <h4>Ghiduri pentru browsere populare:</h4>
                <ul>
                  <li><strong>Chrome:</strong> Setări → Confidențialitate și securitate → Cookie-uri și alte date ale site-urilor</li>
                  <li><strong>Firefox:</strong> Opțiuni → Confidențialitate și securitate → Cookie-uri și date ale site-ului</li>
                  <li><strong>Safari:</strong> Preferințe → Confidențialitate → Gestionarea datelor site-ului web</li>
                  <li><strong>Edge:</strong> Setări → Cookie-uri și permisiuni site</li>
                </ul>
              </div>

              <div className="important-note">
                <h4>⚠️ Notă importantă</h4>
                <p>
                  Dacă dezactivezi anumite cookie-uri, este posibil ca unele funcții ale site-ului să nu 
                  funcționeze corect. De exemplu, s-ar putea să nu poți rămâne autentificat sau să-ți 
                  pierzi preferințele salvate.
                </p>
              </div>
            </section>

            <section className="policy-section">
              <h2>Cookie-uri de la terți</h2>
              <p>
                Pe site-ul nostru folosim și servicii de la terți care pot plasa propriile cookie-uri:
              </p>
              <ul>
                <li><strong>Google Analytics:</strong> Pentru statistici anonime de utilizare</li>
                <li><strong>Cloudinary:</strong> Pentru optimizarea și livrarea imaginilor</li>
                <li><strong>Font Awesome:</strong> Pentru iconițe</li>
              </ul>
              <p>
                Aceste servicii au propriile politici de confidențialitate și cookie-uri pe care te încurajăm să le citești.
              </p>
            </section>

            <section className="policy-section">
              <h2>Consimțământul tău</h2>
              <p>
                Prin continuarea utilizării site-ului nostru, îți dai consimțământul pentru utilizarea cookie-urilor 
                conform acestei politici. Poți să-ți retragi consimțământul oricând prin modificarea setărilor 
                browser-ului tău sau prin contactarea noastră.
              </p>
              <p>
                Pentru cookie-urile strict necesare, nu este nevoie de consimțământ, deoarece acestea sunt 
                esențiale pentru funcționarea site-ului.
              </p>
            </section>

            <section className="policy-section">
              <h2>Actualizări ale acestei politici</h2>
              <p>
                Această politică de cookie-uri poate fi actualizată periodic pentru a reflecta modificările 
                în practicile noastre sau din motive legale și de reglementare. Te încurajăm să revizuiești 
                această pagină din când în când.
              </p>
              <p className="last-updated">
                <strong>Ultima actualizare:</strong> August 2025
              </p>
            </section>

            <section className="policy-section contact-section">
              <h2>Contactează-ne</h2>
              <p>
                Dacă ai întrebări despre această politică de cookie-uri sau despre practicile noastre 
                de confidențialitate, te rugăm să ne contactezi:
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong> privacy@hobbiz.ro</p>
                <p><strong>Adresă:</strong> București, România</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

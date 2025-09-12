import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './CookiePolicy.css';

export default function CookiePolicy() {
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <div className="cookie-policy-page">
        <div className="cookie-policy-container">
          {/* Mobile header: back + title for Cookie Policy */}
          <div className="mobile-header">
            <IconButton
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
              className="mobile-back-btn"
              disableRipple
              disableFocusRipple
              aria-label="Înapoi"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="mobile-header-title">Politica cookie-urilor</Typography>
          </div>
          {/* Hero Section */}
          <div className="cookie-policy-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🍪</span>
              <span>Politica Cookie-urilor</span>
            </div>
            <h1 className="hero-title">
              Înțelege cum folosim <span className="highlight">cookie-urile</span>
            </h1>
          </div>

          {/* Main Content */}
          <div className="cookie-policy-content">
            {/* Cuprins */}
            <nav className="cookie-toc" aria-label="Cuprins">
              <h2 className="toc-title">Cuprins</h2>
              <ul>
                <li><a href="#ce-sunt-cookieurile">Ce sunt cookie-urile?</a></li>
                <li><a href="#tipuri-cookieuri">Tipuri de cookie-uri</a></li>
                <li><a href="#de-ce-folosim">De ce folosim cookie-uri?</a></li>
                <li><a href="#gestionare">Cum să gestionezi cookie-urile</a></li>
                <li><a href="#terti">Cookie-uri de la terți</a></li>
                <li><a href="#consimtamant">Consimțământul tău</a></li>
                <li><a href="#actualizari">Actualizări</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <section id="ce-sunt-cookieurile" className="policy-section">
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

            <section id="tipuri-cookieuri" className="policy-section">
              <h2>Tipuri de cookie-uri pe care le folosim</h2>
              
              <div className="cookie-type">
                <h3>1. Cookie-uri strict necesare</h3>
                <p>
                  Aceste cookie-uri sunt esențiale pentru funcționarea platformei Hobbiz. Ele îți permit să navighezi pe site, 
                  să te autentifici în contul tău, să publici anunțuri, să salvezi favorite și să folosești sistemul de chat. 
                  Fără aceste cookie-uri, serviciile de bază ale platformei nu ar putea funcționa.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Autentificare</span>
                  <span className="cookie-tag">Sesiune utilizator</span>
                  <span className="cookie-tag">Coș favorite</span>
                  <span className="cookie-tag">Chat securizat</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>2. Cookie-uri de preferințe</h3>
                <p>
                  Aceste cookie-uri îți permit să personalizezi experiența pe Hobbiz prin salvarea preferințelor tale, 
                  cum ar fi tema preferată (modul întunecat/luminos), categoriile favorite de anunțuri, regiunea ta 
                  pentru afișarea anunțurilor locale și setările de notificare.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Tema (light/dark)</span>
                  <span className="cookie-tag">Regiunea preferată</span>
                  <span className="cookie-tag">Categorii favorite</span>
                  <span className="cookie-tag">Setări notificări</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>3. Cookie-uri de analiză</h3>
                <p>
                  Aceste cookie-uri sunt folosite prin platforme precum Google Analytics și Umami pentru a colecta 
                  informații despre modul în care utilizezi site-ul nostru. Ele ne ajută să înțelegem care pagini 
                  sunt vizitate cel mai des și cum navighezi prin platforma Hobbiz. Datele sunt anonimizate și agregate.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Google Analytics</span>
                  <span className="cookie-tag">Umami Analytics</span>
                  <span className="cookie-tag">Statistici vizite</span>
                  <span className="cookie-tag">Comportament navigare</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>4. Cookie-uri de marketing</h3>
                <p>
                  Aceste cookie-uri ne ajută să îți afișăm anunțuri și recomandări relevante pe platforma Hobbiz. 
                  De exemplu, îți putem sugera anunțuri din categoriile care te interesează sau servicii similare 
                  cu cele pe care le-ai vizitat anterior. Nu împărtășim aceste informații cu terți pentru publicitate.
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">Recomandări anunțuri</span>
                  <span className="cookie-tag">Categorii de interes</span>
                  <span className="cookie-tag">Servicii similare</span>
                  <span className="cookie-tag">Experiență personalizată</span>
                </div>
              </div>
            </section>

            <section id="de-ce-folosim" className="policy-section">
              <h2>De ce folosim cookie-uri?</h2>
              <div className="reasons-grid">
                <div className="reason-card">
                  <div className="reason-icon">🔐</div>
                  <h4>Securitate și autentificare</h4>
                  <p>Pentru a-ți menține contul securizat pe Hobbiz și pentru a-ți permite să publici anunțuri și să folosești chat-ul în siguranță.</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">⚙️</div>
                  <h4>Funcționalitate și îmbunătățiri</h4>
                  <p>Pentru a salva preferințele tale (tema, regiunea, categoriile favorite) și pentru a îmbunătăți platforma pe baza modului în care este folosită.</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">🎯</div>
                  <h4>Recomandări relevante</h4>
                  <p>Pentru a-ți sugera anunțuri și servicii care te-ar putea interesa pe baza categoriilor pe care le explorezi.</p>
                </div>
              </div>
            </section>

            <section id="gestionare" className="policy-section">
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
                  Dacă dezactivezi anumite cookie-uri, este posibil ca unele funcții ale platformei Hobbiz să nu 
                  funcționeze corect. De exemplu, s-ar putea să nu poți rămâne autentificat, să-ți pierzi 
                  anunțurile favorite salvate, sau să nu primești notificări noi pentru mesajele din chat.
                </p>
              </div>
            </section>

            <section id="terti" className="policy-section">
              <h2>Cookie-uri de la terți</h2>
              <p>
                Pe platforma Hobbiz folosim servicii de la terți care pot plasa propriile cookie-uri pentru a îmbunătăți experiența ta:
              </p>
              <ul>
                <li><strong>Cloudinary:</strong> Pentru optimizarea și livrarea rapidă a imaginilor anunțurilor</li>
                <li><strong>Google Analytics/Umami</strong> Folosite pentru a analiza traficul pe site și comportamentul utilizatorilor</li>
                <li><strong>Google Maps:</strong> Pentru afișarea locațiilor anunțurilor (dacă este cazul)</li>
              </ul>
              <p>
                Aceste servicii au propriile politici de confidențialitate și cookie-uri pe care te încurajăm să le citești.
              </p>
            </section>

            <section id="consimtamant" className="policy-section">
              <h2>Consimțământul tău</h2>
              <p>
                Prin utilizarea platformei Hobbiz, îți dai consimțământul pentru utilizarea cookie-urilor 
                conform acestei politici. Pentru funcțiile esențiale (autentificare, publicare anunțuri, chat), 
                cookie-urile sunt necesare pentru buna funcționare a serviciului.
              </p>
              <p>
                Poți să-ți retragi consimțământul pentru cookie-urile non-esențiale oricând prin modificarea 
                setărilor browser-ului tău sau prin contactarea echipei Hobbiz.
              </p>
            </section>

            <section id="actualizari" className="policy-section">
              <h2>Actualizări ale acestei politici</h2>
              <p>
                Această politică de cookie-uri poate fi actualizată periodic pentru a reflecta modificările 
                în practicile noastre sau din motive legale și de reglementare. Te încurajăm să revizuiești 
                această pagină din când în când.
              </p>
              <p className="last-updated">
                <strong>Ultima actualizare:</strong> Septembrie 2025
              </p>
            </section>

            <section id="contact" className="policy-section contact-section">
              <h2>Contactează-ne</h2>
              <p>
                Dacă ai întrebări despre această politică de cookie-uri sau despre utilizarea datelor pe platforma Hobbiz, 
                te rugăm să ne contactezi:
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong> privacy@hobbiz.ro</p>
                <p><strong>Suport:</strong> prin chat-ul de pe platformă</p>
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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import './TermsConditions.css';

const TermsConditions = () => {
  const navigate = useNavigate();
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
          aria-label="Înapoi"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="mobile-header-title">Termeni și condiții</Typography>
      </div>
      <div className="terms-conditions__header">
        <span className="terms-conditions__icon" role="img" aria-label="contract">📝</span>
        <h1>Termeni și condiții</h1>
        <p className="terms-conditions__date">Ultima actualizare: 5 septembrie 2025</p>
      </div>

      <div className="terms-conditions__intro">
        <div className="terms-conditions__intro-content">
          <span className="terms-conditions__intro-icon" role="img" aria-label="info">ℹ️</span>
          <div>
            <strong>Acordul de utilizare a platformei Hobbiz</strong>
            <p>
              Prin accesarea și utilizarea platformei Hobbiz, acceptați să respectați termenii și condițiile prezentate în acest document. Vă rugăm să citiți cu atenție aceste prevederi înainte de a crea un cont sau de a utiliza serviciile noastre.
            </p>
          </div>
        </div>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>1. Definiții și interpretare</h2>
          <p>
            În cadrul acestor termeni și condiții, următoarele definiții se aplică: <strong>"Platforma"</strong> se referă la website-ul Hobbiz și toate aplicațiile mobile asociate; <strong>"Servicii"</strong> include toate funcționalitățile oferite prin platformă, inclusiv publicarea anunțurilor, căutarea, comunicarea între utilizatori și procesarea plăților; <strong>"Utilizator"</strong> desemnează orice persoană fizică sau juridică care accesează sau folosește platforma; <strong>"Conținut"</strong> include texte, imagini, video, date și alte materiale încărcate pe platformă.
          </p>
          <p>
            Platforma Hobbiz funcționează ca un marketplace digital care conectează persoane interesate să vândă sau să cumpere produse și servicii diverse. Nu suntem proprietarii sau vânzătorii produselor listate, ci facilităm interacțiunea între utilizatori prin intermediul tehnologiilor web moderne, inclusiv React.js, Node.js și baze de date MongoDB.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>2. Eligibilitate și înregistrare</h2>
          
          <h3>Cerințe de vârstă și capacitate juridică</h3>
          <p>
            Pentru a utiliza serviciile Hobbiz, trebuie să aveți minimum 18 ani și să dețineți capacitatea juridică deplină conform legislației românești. Minorilor cu vârsta cuprinsă între 16-18 ani li se permite utilizarea platformei doar cu consimțământul explicit al părinților sau reprezentanților legali și sub supravegherea acestora.
          </p>
          <p>
            Persoanele juridice pot utiliza platforma prin intermediul reprezentanților autorizați, care răspund pentru toate acțiunile întreprinse în numele organizației. Verificăm documentele de înregistrare pentru conturile business și ne rezervăm dreptul de a solicita documente suplimentare pentru validarea identității.
          </p>
          
          <h3>Procesul de înregistrare</h3>
          <p>
            Crearea unui cont necesită furnizarea unor informații exacte și complete: nume real, adresă de email validă și număr de telefon functional. Informațiile false sau înșelătoare constituie o încălcare a acestor termeni și pot duce la suspendarea sau închiderea contului fără preaviz.
          </p>
          <p>
            Suportăm înregistrarea prin metode multiple: email și parolă, autentificare prin Google OAuth 2.0, sau prin alte furnizori de identitate autorizați. Fiecare utilizator poate deține un singur cont activ, iar crearea de conturi multiple pentru evitarea restricțiilor este strict interzisă.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>3. Utilizarea platformei și anunțuri</h2>
          
          <h3>Publicarea anunțurilor</h3>
          <p>
            Utilizatorii pot publica anunțuri pentru vânzarea de produse noi sau second-hand, prestarea de servicii, închirierea de bunuri sau alte tranzacții comerciale legale. Fiecare anunț trebuie să conțină o descriere exactă și completă a produsului sau serviciului, fotografii reale și nemodificate și un preț corect și transparent.
          </p>
          <p>
            Este strict interzisă publicarea de anunțuri pentru: produse contrafăcute sau piratate, substanțe interzise prin lege, arme și muniții, animale protejate sau obținute ilegal, servicii ilegale sau imorale, conținut pentru adulți sau materiale ce încalcă drepturile de autor. Monitorizăm activ conținutul prin algoritmi automatizați și moderare umană.
          </p>
          
          <h3>Responsabilitățile utilizatorilor</h3>
          <p>
            Utilizatorii sunt integral responsabili pentru conținutul publicat, exactitatea informațiilor furnizate și respectarea tuturor legilor aplicabile. Ne rezervăm dreptul de a elimina orice conținut care încalcă acești termeni sau legislația în vigoare, fără obligația de a oferi explicații detaliate.
          </p>
          <p>
            Comunicarea între utilizatori trebuie să se desfășoare într-un mod respectuos și professional. Hărțuirea, amenințările, limbajul vulgar sau discriminatoriu, spam-ul și tentativele de fraudă vor fi sancționate prin restricții temporare sau permanente ale contului.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>4. Tranzacții și plăți</h2>
          
          <h3>Facilitarea tranzacțiilor</h3>
          <p>
            Hobbiz acționează ca intermediar tehnologic între cumpărători și vânzători, fără a fi parte în tranzacțiile efectuate. Nu garantăm calitatea, autenticitatea sau conformitatea produselor vândute, acestea fiind responsabilitatea exclusivă a vânzătorilor. Recomandăm utilizatorilor să fie precauți și să verifice întotdeauna produsele înainte de finalizarea tranzacțiilor.
          </p>
          <p>
            Pentru anumite servicii premium, procesăm plăți prin intermediul procesatorilor certificați Stripe și PayPal, care respectă standardele PCI DSS pentru securitatea datelor financiare. Nu stocăm informații despre carduri de credit pe serverele noastre, toate datele sensibile fiind gestionate exclusiv de furnizorii specializați.
          </p>
          
          <h3>Dispute și rezolvarea conflictelor</h3>
          <p>
            În cazul disputelor între utilizatori, oferim un sistem intern de raportare și mediere, însă responsabilitatea finală pentru rezolvarea conflictelor revine părților implicate. Pentru tranzacții de valoare mare, recomandăm utilizarea de contracte scrise și metode de plată securizate care oferă protecție pentru ambele părți.
          </p>
          <p>
            Putem interveni prin suspendarea temporară a conturilor implicate în dispute repetate sau grave, dar nu avem obligația legală de a arbitra conflictele comerciale dintre utilizatori. Pentru situații care implică posibile infracțiuni, cooperăm cu autoritățile competente conform cerințelor legale.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>5. Proprietate intelectuală</h2>
          
          <h3>Drepturile platformei</h3>
          <p>
            Codul sursă, designul, logo-ul, mărcile comerciale și toate elementele tehnice ale platformei Hobbiz sunt protejate prin drepturi de autor și proprietate intelectuală. Utilizarea neautorizată a acestor elemente, inclusiv copierea codului sau replicarea designului, constituie o încălcare a drepturilor noastre și poate fi urmărită legal.
          </p>
          <p>
            Tehnologiile folosite (React.js, Node.js, MongoDB) sunt open-source și utilizate conform licențelor respective, însă implementarea specifică și arhitectura sistemului nostru sunt proprietate exclusivă. Interzicerea reverse engineering-ului sau tentativelor de replicare a funcționalităților este strict aplicată.
          </p>
          
          <h3>Conținutul utilizatorilor</h3>
          <p>
            Utilizatorii rămân proprietarii conținutului pe care îl publică (fotografii, descrieri, recenzii), dar acordă Hobbiz o licență neexclusivă, transferabilă și sub-licențiabilă pentru a afișa, modifica și distribui acest conținut în scopul furnizării serviciilor platformei.
          </p>
          <p>
            Este responsabilitatea utilizatorilor să se asigure că dețin toate drepturile necesare pentru conținutul publicat și că nu încalcă drepturile de autor ale terților. În cazul reclamațiilor DMCA valide, vom elimina prompt conținutul problematic și vom lua măsurile necesare împotriva conturilor care încalcă în mod repetat drepturile de autor.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>6. Securitate și protecția datelor</h2>
          
          <h3>Măsuri de securitate tehnice</h3>
          <p>
            Implementăm măsuri avansate de securitate informatică: criptarea SSL/TLS pentru toate comunicațiile, hashing-ul securizat al parolelor cu algoritmi bcrypt, protecție împotriva atacurilor CSRF și XSS, firewall-uri configurate și monitorizare constantă pentru activități suspecte. Actualizăm regulat toate componentele software pentru a corecta vulnerabilitățile de securitate.
          </p>
          <p>
            Datele sunt stocate în centre de date certificate SOC 2 Type II, cu backup-uri automate zilnice și sisteme de redundanță geografică. Accesul la sistemele de producție este strict controlat prin autentificare cu doi factori și jurnalizarea completă a activităților administrative.
          </p>
          
          <h3>Responsabilitățile utilizatorilor</h3>
          <p>
            Utilizatorii trebuie să păstreze confidențialitatea credențialelor de acces, să folosească parole complexe și unice și să ne notifice imediat în cazul suspiciunii că contul a fost compromis. Nu suntem responsabili pentru pierderi rezultate din neglijența utilizatorilor în păstrarea securității conturilor.
          </p>
          <p>
            Activarea autentificării cu doi factori este puternic recomandată pentru toate conturile, în special pentru cele care gestionează tranzacții financiare frecvente. Oferim opțiuni multiple: SMS, aplicații TOTP (Google Authenticator, Authy) și chei hardware compatibile FIDO2.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>7. Limitări de răspundere</h2>
          
          <h3>Excluderi de răspundere</h3>
          <p>
            Hobbiz nu este responsabil pentru: daunele rezultate din tranzacțiile între utilizatori, pierderea de date din cauza defecțiunilor hardware sau software, întreruperile temporare ale serviciilor din motive tehnice, acțiunile frauduloase ale utilizatorilor sau terților sau consecințele utilizării inadecvate a platformei.
          </p>
          <p>
            În niciun caz răspunderea noastră totală nu va depăși valoarea taxelor plătite de utilizator pentru serviciile premium în ultimele 12 luni. Această limitare se aplică indiferent de natura reclamației: contractuală, delictuală sau din orice altă cauză legală.
          </p>
          
          <h3>Forță majoră</h3>
          <p>
            Nu suntem responsabili pentru întârzieri sau imposibilitatea de a îndeplini obligațiile din cauza evenimentelor de forță majoră: dezastre naturale, războaie, atacuri cibernetice la scară largă, reglementări guvernamentale restrictive sau alte evenimente în afara controlului nostru rezonabil.
          </p>
          <p>
            În astfel de situații, vom depune toate eforturile rezonabile pentru a minimiza impactul asupra utilizatorilor și pentru a restabili serviciile cât mai rapid posibil. Utilizatorii vor fi informați prompt despre orice întreruperi majore prin canalele noastre oficiale de comunicare.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>8. Modificări și încetarea serviciilor</h2>
          
          <h3>Modificări ale termenilor</h3>
          <p>
            Ne rezervăm dreptul de a modifica acești termeni și condiții pentru a reflecta schimbările în serviciile oferite, cerințele legale sau practicile comerciale. Utilizatorii vor fi notificați cu minimum 30 de zile înainte de intrarea în vigoare a modificărilor majore prin email și notificări în platformă.
          </p>
          <p>
            Continuarea utilizării serviciilor după intrarea în vigoare a modificărilor constituie acceptarea noilor termeni. Utilizatorii care nu sunt de acord cu modificările pot închide conturile și înceta utilizarea platformei fără penalități suplimentare.
          </p>
          
          <h3>Suspendarea și închiderea conturilor</h3>
          <p>
            Putem suspenda sau închide conturile care încalcă acești termeni, participă la activități frauduloase, afectează negativ experiența altor utilizatori sau prezintă riscuri de securitate pentru platformă. În funcție de gravitatea încălcării, putem aplica avertismente, restricții temporare sau închiderea definitivă.
          </p>
          <p>
            Utilizatorii pot închide voluntar conturile oricând prin setările platformei. La închiderea contului, datele personale vor fi anonimizate sau șterse conform politicii noastre de confidențialitate, iar anunțurile active vor fi eliminate automat.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>9. Legea aplicabilă și jurisdicția</h2>
          
          <h3>Cadrul legal</h3>
          <p>
            Acești termeni și condiții sunt guvernați de legea română și se interpretează conform acesteia. Toate disputele rezultate din utilizarea platformei vor fi soluționate de instanțele competente din România, utilizatorii renunțând la orice pretenție de incompetență teritorială.
          </p>
          <p>
            Pentru utilizatorii din Uniunea Europeană, respectăm prevederile Regulamentului Digital Services Act (DSA) și ale Directivei privind Drepturile Consumatorilor. Consumatorii pot beneficia de proceduri alternative de soluționare a disputelor conform reglementărilor UE aplicabile.
          </p>
          
          <h3>Conformitate cu reglementările</h3>
          <p>
            Platforma respectă prevederile GDPR pentru protecția datelor, reglementările PSD2 pentru serviciile de plată, cerințele de e-commerce conform OUG 34/2014 și alte acte normative relevante din România și UE. Cooperăm cu autoritățile de reglementare și aplicăm prompt orice cerințe legale noi.
          </p>
          <p>
            Pentru problemele specifice protecției consumatorilor, utilizatorii se pot adresa ANPC (Autoritatea Națională pentru Protecția Consumatorilor) sau pot folosi platforma europeană ODR pentru soluționarea online a disputelor comerciale.
          </p>
        </section>
      </div>

      <div className="terms-conditions__content">
        <section>
          <h2>10. Contact și asistență</h2>
          
          <h3>Informații de contact</h3>
          <p>
            Pentru întrebări despre acești termeni și condiții, reclamații sau solicitări de asistență, ne puteți contacta prin următoarele modalități: email oficial la legal@hobbiz.ro, formularul de contact din platformă sau poșta tradițională la adresa sediului social înregistrat.
          </p>
          <p>
            Echipa noastră de asistență răspunde în general în termen de 24-48 de ore pentru întrebările standard și în maximum 72 de ore pentru problemele complexe care necesită investigații tehnice sau legale. Pentru urgențe de securitate, oferim suport accelerat prin canalele prioritare.
          </p>
          
          <h3>Procedura de reclamații</h3>
          <p>
            Reclamațiile se pot depune prin sistemul integrat din platformă, care permite urmărirea statusului și primirea de notificări automate. Pentru situații grave, acceptăm și comunicarea directă prin email la adresa dedicată complaints@hobbiz.ro.
          </p>
          <p>
            Investigăm toate reclamațiile într-un mod imparțial și transparent, respectând drepturile tuturor părților implicate. Rezultatele investigațiilor sunt comunicate în scris, iar pentru cazurile complexe oferim explicații detaliate despre măsurile luate.
          </p>
        </section>
      </div>

      <div className="terms-conditions__footer">
        <p>
          Documentul a fost actualizat la data de 5 septembrie 2025 și intră în vigoare imediat pentru toți utilizatorii platformei Hobbiz. 
          Pentru versiunile anterioare ale acestor termeni, vă rugăm să ne contactați la adresa legal@hobbiz.ro.
        </p>
      </div>
    </div>
  </div>
  );
};

export default TermsConditions;

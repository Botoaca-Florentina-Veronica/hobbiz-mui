import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => (
  <div className="privacy-policy">
    <div className="privacy-policy__container">
      <div className="privacy-policy__header">
        <span className="privacy-policy__icon" role="img" aria-label="shield">🛡️</span>
        <h1>Politica de confidențialitate</h1>
        <p className="privacy-policy__date">Ultima actualizare: 19 iulie 2025</p>
      </div>

      <div className="privacy-policy__intro">
        <div className="privacy-policy__intro-content">
          <span className="privacy-policy__intro-icon" role="img" aria-label="info">ℹ️</span>
          <div>
            <strong>Transparență și protecție a datelor</strong>
            <p>
              La Hobbiz, considerăm protecția datelor personale o responsabilitate fundamentală. Acest document descrie în detaliu practicile noastre de gestionare a informațiilor, conform Regulamentului General privind Protecția Datelor (GDPR) și legislației românești aplicabile.
            </p>
          </div>
        </div>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>1. Scopul și domeniul de aplicare</h2>
          <p>
            Această politică se aplică tuturor informațiilor colectate prin intermediul platformei Hobbiz, inclusiv prin website, aplicații mobile și orice alte interfețe asociate. Documentul definește cadrul legal și operațional pentru prelucrarea datelor cu caracter personal, inclusiv scopurile de colectare, metodele de procesare, drepturile utilizatorilor și măsurile de securitate implementate.
          </p>
          <p>
            Operatorul de date este SC Hobbiz SRL, înregistrată în România, care determină scopurile și mijloacele prelucrării datelor. Pentru orice nelămuriri referitoare la conținutul acestei politici, vă rugăm să ne contactați folosind detaliile furnizate în secțiunea finală.
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>2. Categorii de date prelucrate</h2>
          
          <h3> Date furnizate voluntar</h3>
          <p>
            În procesul de creare a contului și utilizare a platformei, colectăm o serie de informații personale necesare pentru furnizarea serviciilor noastre. Acestea includ nume complet, adresă de email validă, număr de telefon verificat, date demografice opționale (vârstă, gen) și orice alte informații pe care le introduceți voluntar în profilul utilizatorului sau în conținutul generat (anunțuri, mesaje, recenzii).
          </p>
          <p>
            Pentru utilizatorii care optează pentru servicii premium, colectăm și procesăm date de plată necesare procesării tranzacțiilor financiare. Aceste informații sunt prelucrate exclusiv prin intermediul procesatorilor de plăți certificați PCI DSS, fără a fi stocate pe serverele noastre.
          </p>
          
          <h3> Date colectate automat</h3>
          <p>
            Sistemul nostru înregistrează automat date tehnice despre dispozitivul și interacțiunile dumneavoastră cu platforma. Acestea includ adresa IP, identificatori unici de dispozitiv, tipul și versiunea browserului, sistemul de operare, date de utilizare (pagini accesate, timpul petrecut, acțiuni întreprinse) și date aproximative de localizare derivate din adresa IP sau setările dispozitivului.
          </p>
          <p>
            Folosim cookie-uri și tehnologii similare pentru a îmbunătăți funcționalitatea platformei, analiza traficului și personalizarea experienței. Puteți gestiona preferințele pentru aceste tehnologii prin setările browserului sau prin sistemul nostru de consimțământ.
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>3. Scopurile și bazele juridice ale prelucrării</h2>
          <p>
            Prelucrăm datele dumneavoastră personale pe baza următoarelor fundamentări juridice și pentru următoarele scopuri specifice:
          </p>
          
          <h3> Executarea contractului</h3>
          <p>
            Pentru a vă oferi acces la platformă și serviciile solicitate, inclusiv gestionarea contului, publicarea anunțurilor, facilitarea comunicării între utilizatori și procesarea tranzacțiilor financiare. Această prelucrare este esențială pentru îndeplinirea obligațiilor noastre contractuale față de dumneavoastră.
          </p>
          
          <h3> Interese legitime</h3>
          <p>
            Pentru îmbunătățirea continuă a platformei, prevenirea fraudelor și activităților abuzive, analiza modului de utilizare a serviciilor noastre, dezvoltarea de noi funcționalități și asigurarea securității sistemului. Implementăm măsuri adecvate pentru a vă proteja drepturile și libertățile în aceste procese.
          </p>
          
          <h3> Consimțământ</h3>
          <p>
            Pentru activități de marketing direct, anumite tipuri de analize de date și utilizarea anumitor cookie-uri. Puteți retrage consimțământul oricând, fără a afecta legalitatea prelucrării efectuate anterior retragerii.
          </p>
          
          <h3> Conformitate legală</h3>
          <p>
            Pentru îndeplinirea obligațiilor legale, inclusiv în domeniul fiscal, al prevenirii spălării banilor și al altor reglementări aplicabile. Aceste prelucrări sunt efectuate numai în măsura cerută de legislația în vigoare.
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>4. Securitatea și confidențialitatea datelor</h2>
          <p>
            Am implementat un set complet de măsuri tehnice și organizatorice pentru protejarea datelor dumneavoastră împotriva accesului neautorizat, modificării, divulgării sau distrugerii neautorizate. Acestea includ:
          </p>
          
          <p>
            <strong>Criptare avansată:</strong> Toate datele sunt criptate atât în tranzit (folosind protocoale TLS 1.2+), cât și la rest, cu algoritmi moderni. Datele sensibile suplimentare sunt criptate la nivel de câmp în baza noastră de date.
          </p>
          
          <p>
            <strong>Controlul accesului:</strong> Implementăm principiul privilegiilor minime, cu acces la date strict pe bază de necesitate funcțională. Toate accesurile sunt monitorizate și jurnalizate, cu revizuiri periodice ale permisiunilor.
          </p>
          
          <p>
            <strong>Testări de securitate:</strong> Efectuăm teste de penetrare regulate și evaluări de vulnerabilitate, cu remedierea imediată a oricăror probleme identificate. Sistemul nostru este protejat împotriva principalelor vectori de atac precum SQL injection, XSS și CSRF.
          </p>
          
          <p>
            <strong>Politici interne stricte:</strong> Personalul nostru este supus unor obligații stricte de confidențialitate și beneficiază de formare periodică în domeniul protecției datelor. Documentăm și raportăm orice incident de securitate conform cerințelor legale.
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>5. Securitatea informațiilor tale</h2>
          
          <p>
              Protejarea datelor dumneavoastră personale reprezintă o prioritate absolută pentru echipa noastră. Am implementat un sistem complex de măsuri de securitate care depășește cerințele legale minime, asigurându-ne că informațiile sunt protejate împotriva oricăror amenințări.
          </p>

          <h3>Arhitectura noastră de securitate</h3>
          <p>
              Infrastructura noastră tehnică este găzduită în centre de date de nivel Tier III+, certificate ISO 27001, situate în Uniunea Europeană. Implementăm o strategie de securitate multi-nivel care include:
          </p>
        
        <p>
            <strong>Protecție perimetrală:</strong> Firewall-uri de ultimă generație, sisteme de prevenție a intruziunilor (IPS) și protecție DDoS care monitorizează și filtrează tot traficul în timp real. Aceste sisteme sunt configurate să detecteze și să blocheze automat orice activitate suspectă.
        </p>
        
        <p>
            <strong>Securitate aplicativă:</strong> Toate componentele software sunt dezvoltate conform principiilor "secure by design" și "privacy by default". Efectuăm revizuiri periodice ale codului și teste de penetrare pentru a identifica și remedia vulnerabilitățile în faza incipientă.
        </p>
        
        <p>
            <strong>Controlul accesului:</strong> Implementăm autentificare cu factori multipli (MFA) pentru toate conturile privilegiate și accesul la date sensibile. Sistemul nostru de gestionare a identității și accesului (IAM) asigură respectarea principiului privilegiilor minime, cu aprobări în trepte pentru operațiuni critice.
        </p>

        <h3>Protecția datelor în stocare și tranzit</h3>
        <p>
            <strong>Criptare avansată:</strong> Toate datele sunt criptate folosind algoritmi AES-256 pentru datele la rest și TLS 1.3 cu criptare end-to-end pentru datele în tranzit. Cheile de criptare sunt gestionate prin servicii dedicate HSM (Hardware Security Modules) și rotite periodic.
        </p>
        
        <p>
            <strong>Backup-uri securizate:</strong> Efectuăm backup-uri zilnice incrementale și săptămânale complete, stocate geografic redundant și protejate prin criptare. Testăm periodic procesul de restaurare pentru a ne asigura că datele pot fi recuperate rapid și integral în caz de necesitate.
        </p>

        <h3>Managementul vulnerabilităților și răspunsul la incidente</h3>
        <p>
            <strong>Program continuu de testare:</strong> Efectuăm scanări automate zilnice pentru vulnerabilități și angajăm testere de penetrare externe trimestrial pentru a evalua securitatea sistemelor noastre. Prioritizăm remedierea vulnerabilităților critice în maximum 24 de ore de la detectare.
        </p>
        
        <p>
            <strong>Plan de răspuns la incidente:</strong> Avem un procedură detaliată de răspuns la incidente de securitate, care include notificarea autorităților și a utilizatorilor afectați în maxim 72 de ore de la confirmarea incidentului, conform cerințelor GDPR.
        </p>

        <h3>Conștientizarea și formarea utilizatorilor</h3>
        <p>
            <strong>Recomandări pentru utilizatori:</strong> Vă încurajăm să luați măsuri suplimentare pentru protejarea propriului cont:
        </p>
        
        <ul>
            <li>Folosiți parole complexe și unice pentru contul Hobbiz</li>
            <li>Activați autentificarea cu doi factori în setările contului</li>
            <li>Actualizați periodic adresa de email și numărul de telefon de recuperare</li>
            <li>Evitați accesul contului din rețele Wi-Fi publice neprotejate</li>
            <li>Verificați periodic activitatea contului în secțiunea de securitate</li>
        </ul>
        
        <p>
            <strong>Echipa noastră:</strong> Toți angajații care au acces la datele utilizatorilor completează programe anuale de formare în securitatea informației și protecția datelor, inclusiv simulări de atacuri de phishing și traininguri practice privind gestionarea corectă a datelor sensibile.
        </p>

        <h3>Certificări și audituri externe</h3>
        <p>
            Sistemul nostru este supus periodic unor audituri externe independente pentru a verifica conformitatea cu standardele:
        </p>
        
        <ul>
            <li>ISO 27001 pentru managementul securitării informațiilor</li>
            <li>SOC 2 Type II pentru controalele de securitate și confidențialitate</li>
            <li>PCI DSS pentru procesarea plăților (nivel 1)</li>
            <li>GDPR prin audituri regulate efectuate de firme de specialitate</li>
        </ul>
        
        <p>
            Pentru orice întrebări specifice legate de măsurile noastre de securitate sau pentru a raporta orice problemă de securitate pe care ați identificat-o, vă rugăm să ne contactați imediat la <a href="mailto:security@hobbiz.ro">security@hobbiz.ro</a>.
        </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>6. Drepturile utilizatorilor</h2>
          <p>
            Conform legislației privind protecția datelor, beneficiați de un set complet de drepturi pe care le puteți exercita în orice moment:
          </p>
          
          <p>
            <strong>Dreptul de acces și portabilitate:</strong> Puteți solicita o copie a datelor dumneavoastră personale într-un format structurat, utilizat în mod obișnuit și care poate fi citit automat. Vă vom furniza toate informațiile pe care le deținem despre dumneavoastră, inclusiv sursele datelor, scopurile prelucrării și destinatarii acestora.
          </p>
          
          <p>
            <strong>Dreptul de rectificare:</strong> Puteți cere actualizarea oricăror date inexacte sau incomplete.
          </p>

          <p>
            <strong>Dreptul la ștergere:</strong> Puteți solicita ștergerea datelor personale, când acestea nu mai sunt necesare în raport cu scopurile pentru care au fost colectate sau prelucrate.
          </p>
          
          <p>
            <strong>Dreptul la restricționarea prelucrării:</strong> În anumite circumstanțe (cum ar fi contestarea exactității datelor sau obiectarea prelucrării), puteți cere limitarea temporară a prelucrării datelor dumneavoastră personale.
          </p>
          
          <p>
            <strong>Dreptul de opoziție:</strong> Puteți vă opuneți prelucrării datelor dumneavoastră personale atunci când aceasta se bazează pe interes legitim sau este efectuată în scop de marketing direct.
          </p>
          
          <p>
            Pentru a exercita oricare dintre aceste drepturi sau pentru a obține informații suplimentare, vă rugăm să ne contactați prin email la <a href="mailto:protectiadatelor@hobbiz.ro">protectiadatelor@hobbiz.ro</a>. Răspundem la toate solicitările în termen de 30 de zile și putem cere verificarea identității pentru protecția datelor dumneavoastră.
          </p>
        </section>
      </div>

      <div className="privacy-policy__content">
        <section>
          <h2>7. Contact și informații suplimentare</h2>
          <p>
            Dacă aveți întrebări sau nelămuriri referitoare la această politică de confidențialitate sau la practicile noastre de prelucrare a datelor, vă rugăm să ne contactați folosind următoarele detalii:
          </p>
          
          <p>
            <strong>Operator de date:</strong> SC Hobbiz SRL, înregistrată la Registrul Comerțului sub nr. J40/1234/2023, CUI 12345678, cu sediul în Strada Exemplu nr. 10, București, România.
          </p>
          
          <p>
            <strong>Responsabil cu protecția datelor:</strong> Puteți contacta responsabilul nostru cu protecția datelor la adresa <a href="mailto:dpo@hobbiz.ro">dpo@hobbiz.ro</a> pentru orice aspecte legate de prelucrarea datelor personale.
          </p>
          
          <p>
            <strong>Autoritatea de supraveghere:</strong> Aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal dacă considerați că prelucrarea datelor dumneavoastră personale încalcă legislația aplicabilă.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
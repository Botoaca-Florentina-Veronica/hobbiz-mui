import React from 'react';
import { useNavigate } from 'react-router-dom';

// Compact mobile-only legal links inspired by the provided screenshot.
// Uses native <details> for accessible collapsible groups.
export default function MobileLegal() {
  const navigate = useNavigate();

  const go = (e, to) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <div className="mobile-legal" role="navigation" aria-label="Linkuri utile și informații legale">
      <section className="mobile-legal__group">
        <h4 className="mobile-legal__title">Linkuri utile</h4>
        <ul className="mobile-legal__list">
          <li><a href="/despre" onClick={(e)=>go(e,'/despre')}>Despre noi</a></li>
          <li><a href="/contact" onClick={(e)=>go(e,'/contact')}>Contact</a></li>
          <li><a href="/cum-functioneaza" onClick={(e)=>go(e,'/cum-functioneaza')}>Cum funcționează</a></li>
        </ul>
      </section>

  <section className="mobile-legal__group">
        <h4 className="mobile-legal__title">Legal</h4>
        <ul className="mobile-legal__list">
          <li><a href="/termeni" onClick={(e)=>go(e,'/termeni')}>Termeni și condiții</a></li>
          <li><a href="/confidentialitate" onClick={(e)=>go(e,'/confidentialitate')}>Politică de Confidențialitate</a></li>
          <li><a href="/cookie" onClick={(e)=>go(e,'/cookie')}>Cookie Policy</a></li>
        </ul>
      </section>

    </div>
  );
}

import React, { useState } from 'react';
import './AddAnnouncementPage.css';

const CATEGORIES = [
  'Electronics',
  'Cars',
  'Real Estate',
  'Services',
  'Hobby',
  'Other'
];

export default function AddAnnouncementPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [titleChars, setTitleChars] = useState(0);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setTitleChars(e.target.value.length);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send data to backend
    alert('Announcement submitted!');
  };

  return (
    <div className="add-announcement-container">
      <h1 className="add-announcement-title">Publică un anunț </h1>
      <form className="add-announcement-form" onSubmit={handleSubmit}>
        <h2 className="add-announcement-subtitle">Descrie-ți anunțul cu lux de detalii!</h2>
        <label className="add-announcement-label">Adaugă un titlu clar*</label>
        <textarea
          className="add-announcement-title-input"
          placeholder="ex: Predau lecții de fizică, online"
          value={title}
          onChange={handleTitleChange}
          minLength={16}
          maxLength={70}
          required
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">Introdu cel puțin 16 caractere</div>
          <div className="add-announcement-charcount">{titleChars}/70</div>
        </div>
        <label className="add-announcement-label">Categoria*</label>
        <select
          className="add-announcement-category-select"
          value={category}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Alege categoria</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {/* You can add more fields for extra details here */}
        <button className="add-announcement-submit" type="submit">Publică anunțul</button>
      </form>
    </div>
  );
}

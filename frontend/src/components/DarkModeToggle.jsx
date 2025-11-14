import './DarkModeToggle.css';
import { IoSunny, IoMoon } from 'react-icons/io5';

export default function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <div className="dark-mode-toggle">
      <button 
        className="toggle-switch"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Activează modul luminos' : 'Activează modul întunecat'}
      >
        <div className={`toggle-track ${darkMode ? 'dark' : 'light'}`}>
          <div className="toggle-thumb">
            {darkMode ? <IoMoon /> : <IoSunny />}
          </div>
        </div>
      </button>
    </div>
  );
}
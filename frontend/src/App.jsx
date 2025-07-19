import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import { FiUser, FiHeart, FiCompass } from 'react-icons/fi';
import { FiSun, FiMoon } from 'react-icons/fi';
import Header from './components/Header';
import MainStage from './components/MainStage';
import Content from './components/Content';
import Categories from './components/Categories';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import LegalSection from './components/LegalSection';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from "./pages/LoginPage";
import SignupPage from './pages/SignupPage';
import AccountSettings from './pages/AccountSettings';
import OAuthSuccess from './pages/OAuthSuccess';
import AddAnnouncementPage from './pages/AddAnnouncementPage';
import EditAnnouncementPage from './pages/EditAnnouncementPage';
import ProfilePage from './pages/ProfilePage';
import MyAnnouncements from './pages/MyAnnouncements';

import AnnouncementsByCategory from './pages/AnnouncementsByCategory';
import FavoriteAnnouncements from './pages/FavoriteAnnouncements';
import AnnouncementDetails from './pages/AnnouncementDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import About from './pages/About';
import './App.css';
import './mediaQueries.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <Routes>
        {/* Rute de autentificare - fără Header/Footer */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Rute pentru pagini cu layout complet */}
        <Route path="/anunturi-categorie/:category" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AnnouncementsByCategory />
            <Footer />
          </>
        } />
        <Route path="/favorite-announcements" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <FavoriteAnnouncements />
            <Footer />
          </>
        } />
        <Route path="/despre" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <About />
          </>
        } />
        <Route path="/confidentialitate" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <PrivacyPolicy />
            <div className="footer-separator" />
            <LegalSection />
            <Footer />
          </>
        } />
        <Route path="/*" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <MainStage />
            <Content />
            <Categories />
            <CallToAction />
            <div className="footer-separator" />
            <LegalSection />
            <Footer />
          </>
        } />
        <Route path="/setari-cont" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AccountSettings />
            <Footer />
          </>
        } />
        <Route path="/add-announcement" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AddAnnouncementPage />
            <Footer />
          </>
        } />
        <Route path="/edit-announcement" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <EditAnnouncementPage />
            <Footer />
          </>
        } />
        <Route path="/profil" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <ProfilePage />
            <Footer />
          </>
        } />
        <Route path="/anunturile-mele" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <MyAnnouncements />
            <Footer />
          </>
        } />
        <Route path="/announcement/:id" element={<AnnouncementDetails />} />
      </Routes>
    </div>
  );
}

export default App;
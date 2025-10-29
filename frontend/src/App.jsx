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
import DarkModeToggle from './components/DarkModeToggle';

import LoginPage from "./pages/LoginPage";
import SignupPage from './pages/SignupPage';
import AccountSettings from './pages/AccountSettings';
import OAuthSuccess from './pages/OAuthSuccess';
import AddAnnouncementPage from './pages/AddAnnouncementPage';
import EditAnnouncementPage from './pages/EditAnnouncementPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfile from './pages/PublicProfile';
import PublicProfileAllReviews from './pages/PublicProfileAllReviews';
import MyAnnouncements from './pages/MyAnnouncements';
import ChatPage from './pages/ChatPage';

import AnnouncementsByCategory from './pages/AnnouncementsByCategory';
import FavoriteAnnouncements from './pages/FavoriteAnnouncements';
import AnnouncementDetails from './pages/AnnouncementDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import CookiePolicy from './pages/CookiePolicy';
import TermsConditions from './pages/TermsConditions';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AccountMenuMobile from './pages/AccountMenuMobile.jsx';
import useScrollToTop from './hooks/useScrollToTop';
import './App.css';
import './mediaQueries.css';
import './components/Content.css';
import SyncFavoritesModal from './components/SyncFavoritesModal.jsx';
import CookieConsent from './components/CookieConsent';

function App() {
  // Automatically scroll to top on route changes
  useScrollToTop();
  
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
            {/* Ascundem secțiunea legal + copyright pe mobil pentru paginile de categorie */}
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/notificari" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <NotificationsPage />
            <Footer hideOnMobile />
          </>
        } />
        {/* Pagină dedicată pentru meniul de cont pe mobil */}
        <Route path="/cont" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AccountMenuMobile />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/favorite-announcements" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <FavoriteAnnouncements />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/chat" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <ChatPage />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/despre" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <About />
          </>
        } />
        <Route path="/cum-functioneaza" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <HowItWorks />
            <Footer />
          </>
        } />
        <Route path="/confidentialitate" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <PrivacyPolicy />
            {/* separatorul este inclus în Footer, nu mai este nevoie aici */}
            <Footer />
          </>
        } />
        <Route path="/cookie" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <CookiePolicy />
          </>
        } />
        <Route path="/termeni" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <TermsConditions />
            <Footer />
          </>
        } />
        <Route path="/" element={
          <div className="homepage">
              <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <Header />
              <MainStage />
              <Content />
              <Categories />
              <CallToAction />
            <Footer />
            <CookieConsent />
          </div>
        } />
        <Route path="/*" element={
          <div className="homepage">
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <MainStage />
            <Content />
            <Categories />
            <CallToAction />
            {/* separatorul este inclus în Footer, nu mai este nevoie aici */}
            <Footer />
            <CookieConsent />
          </div>
        } />
        <Route path="/setari-cont" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AccountSettings />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/add-announcement" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AddAnnouncementPage />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/edit-announcement" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <EditAnnouncementPage />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/profil" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <ProfilePage />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/profil/:userId" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <PublicProfile />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/profil/:userId/toate-recenziile" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <PublicProfileAllReviews />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/anunturile-mele" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <MyAnnouncements />
            <Footer hideOnMobile />
          </>
        } />
        <Route path="/announcement/:id" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <AnnouncementDetails />
            <Footer hideLegalUpTo1200 />
          </>
        } />
      </Routes>
  <SyncFavoritesModal />
    </div>
  );
}

export default App;
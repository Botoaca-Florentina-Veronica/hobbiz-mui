import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import Header from './components/Header';
import MainStage from './components/MainStage';
import Content from './components/Content';
import Categories from './components/Categories';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from "./pages/LoginPage";
import './App.css';

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
        {/* Ruta de login - fără Header, Footer și DarkModeToggle */}
        <Route path="/login" element={<LoginPage />} />

        {/* Toate celelalte rute - cu Header, Footer și DarkModeToggle */}
        <Route path="/*" element={
          <>
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Header />
            <MainStage />
            <Content />
            <Categories />
            <CallToAction />
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
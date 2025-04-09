import { useState, useEffect } from 'react'
import Header from './components/Header'
import MainStage from './components/MainStage'
import Content from './components/Content'
import Categories from './components/Categories'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import DarkModeToggle from './components/DarkModeToggle'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Header />
      <MainStage />
      <Content />
      <Categories />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default App
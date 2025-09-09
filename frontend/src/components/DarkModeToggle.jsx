import './DarkModeToggle.css';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';

// Switch simplificat - doar culoare & transform. Iconițele sunt suprapuse cu MUI icons pentru claritate vizuală.
const ThemeSwitch = styled(Switch)(({ theme }) => ({
  width: 70,
  height: 38,
  padding: 0,
  display: 'flex',
  position: 'relative',
  '& .MuiSwitch-switchBase': {
    padding: 4,
    transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
    '&.Mui-checked': {
      transform: 'translateX(32px)',
      '& + .MuiSwitch-track': {
    background: 'linear-gradient(135deg,#3a0d21,#56132f)', /* subtle very dark pink base */
    borderColor: '#F51866',
    boxShadow: '0 0 0 1px rgba(245,24,102,0.6), 0 0 10px -2px rgba(245,24,102,0.55) inset'
      },
      '& .MuiSwitch-thumb': {
    background: 'linear-gradient(145deg,#F51866,#fe6585)',
    boxShadow: '0 2px 6px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 6px 2px rgba(245,24,102,.55)'
      }
    },
    '&:active .MuiSwitch-thumb': { transform: 'scale(.85)' },
    '&.Mui-checked:active .MuiSwitch-thumb': { transform: 'scale(.85)' }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 30,
    height: 30,
    marginTop: 1,
  background: 'linear-gradient(135deg,#ffdd55,#ff9e00)',
    borderRadius: '50%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  boxShadow: '0 2px 5px rgba(0,0,0,.30), 0 0 0 1px rgba(255,255,255,.35) inset, 0 0 4px 1px rgba(255,174,0,.45)',
    transition: 'background .45s ease, transform .25s'
  },
  '& .MuiSwitch-track': {
    borderRadius: 32,
  background: 'linear-gradient(135deg,#ffe0cc,#ffccd6)',
  border: '1px solid #ffb3c2',
    opacity: 1,
    boxSizing: 'border-box',
    transition: 'background .5s ease, border-color .5s ease'
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& .MuiSwitch-switchBase': { transition: 'transform .25s ease' },
    '& .MuiSwitch-thumb': { transition: 'background .3s ease' }
  }
}));

export default function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <div className="dark-mode-toggle">
      <div className="theme-switch-wrapper">
        <ThemeSwitch
          checked={darkMode}
          onChange={toggleDarkMode}
          inputProps={{ 'aria-label': 'Comutare dark mode' }}
          disableRipple
        />
        <div
          className={`single-mode-icon ${darkMode ? 'dark' : 'light'}`}
          aria-hidden="true"
          style={{ left: darkMode ? 36 : 4 }}
        >
          {darkMode ? (
            <Brightness4Icon fontSize="small" />
          ) : (
            <Brightness7Icon fontSize="small" />
          )}
        </div>
      </div>
    </div>
  );
}
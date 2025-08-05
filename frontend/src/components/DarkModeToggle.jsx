import { IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon for dark mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon for light mode
import './DarkModeToggle.css';

export default function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <div className="dark-mode-toggle">
      <IconButton 
        onClick={toggleDarkMode}
        color="inherit"
        sx={{
          backgroundColor: darkMode ? '#282828' : '#575757',
          border: darkMode ? '2px solid #3f3f3f' : '2px solid #8b8b8b',
          '&:hover': {
            backgroundColor: darkMode ? '#3f3f3f' : '#717171',
          }
        }}
      >
        {darkMode ? (
          <Brightness7Icon sx={{ color: '#fe6585' }} />
        ) : (
          <Brightness4Icon sx={{ color: '#8b8b8b' }} />
        )}
      </IconButton>
    </div>
  );
}
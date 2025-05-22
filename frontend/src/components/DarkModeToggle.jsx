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
          backgroundColor: darkMode ? '#3f1b0f' : '#503f25',
          '&:hover': {
            backgroundColor: darkMode ? '#503f25' : '#3f1b0f',
          }
        }}
      >
        {darkMode ? (
          <Brightness7Icon sx={{ color: '#e2e7eb' }} />
        ) : (
          <Brightness4Icon sx={{ color: '#e2e7eb' }} />
        )}
      </IconButton>
    </div>
  );
}
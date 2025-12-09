import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Dialog, DialogContent, IconButton, Box, Fade } from '@mui/material';
import { FiSmartphone, FiUsers, FiTrendingUp, FiLayout, FiShield, FiMessageCircle, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './ChooseUs.css';

const icons = {
  1: <FiSmartphone />,
  2: <FiUsers />,
  3: <FiTrendingUp />,
  4: <FiLayout />,
  5: <FiShield />,
  6: <FiMessageCircle />
};

// Helper function to check if dark mode is active
const getIsDarkMode = () => {
  return document.body.classList.contains('dark-mode');
};

export default function ChooseUs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [1, 2, 3, 4, 5, 6];

  const handleOpenPopup = (item) => {
    setSelectedItem(item);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedItem(null);
  };

  // Culori adaptive pentru popup (optimizate pentru light/dark)
  const isDark = getIsDarkMode();
  const popupBg = isDark ? '#121212' : '#ffffff';
  const titleColor = isDark ? '#ffffff' : '#0f1724';
  const descColor = isDark ? 'rgba(255,255,255,0.9)' : '#374151';
  const paperShadow = isDark ? '0 10px 30px rgba(0,0,0,0.6)' : '0 8px 24px rgba(15,23,42,0.08)';
  const closeBtnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const checkBg = isDark ? '#ff0055' : '#16a34a';

  return (
    <section className="choose-us-section">
      <div className="choose-us-container">
        <Typography variant="h2" className="choose-us-title">
          {t('chooseUs.title')}
        </Typography>
        <Typography 
          variant="subtitle1" 
          className="choose-us-subtitle"
          sx={{ 
            textAlign: 'center !important', 
            display: 'block !important',
            width: '100% !important',
            marginLeft: 'auto !important',
            marginRight: 'auto !important'
          }}
        >
          {t('chooseUs.subtitle')}
        </Typography>

        <div className="choose-us-grid">
          {items.map((item) => (
            <div key={item} className="choose-us-card">
              <div className="choose-us-icon-wrapper">
                {icons[item]}
              </div>
              <div className="choose-us-content">
                <h3 className="choose-us-card-title">
                  {t(`chooseUs.items.${item}.title`)}
                </h3>
                <p className="choose-us-card-desc">
                  {t(`chooseUs.items.${item}.desc`)}
                </p>
                <div className="choose-us-link" onClick={() => handleOpenPopup(item)}>
                  {t('chooseUs.seeMore')} <FiChevronRight />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Dialog cu blur background */}
      <Dialog
        open={popupOpen}
        onClose={handleClosePopup}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: popupBg,
            color: titleColor,
            borderRadius: 3,
            boxShadow: paperShadow,
            position: 'relative',
            overflow: 'visible',
            border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(15,23,42,0.06)',
            fontFamily: "'Poppins', sans-serif !important"
          }
        }}
      >
        {selectedItem && (
          <>
            {/* Buton X pentru închidere */}
            <IconButton
              onClick={handleClosePopup}
              aria-label="close"
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: titleColor,
                backgroundColor: closeBtnBg,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                },
                zIndex: 1
              }}
            >
              <FiX size={20} />
            </IconButton>

            <DialogContent sx={{ p: 4, pt: 3 }}>
              {/* Titlu */}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  color: titleColor,
                  fontSize: '1.5rem',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                {t(`chooseUs.items.${selectedItem}.title`)}
              </Typography>

              {/* Descriere */}
              <Typography 
                variant="body1" 
                sx={{ 
                  color: descColor,
                  mb: 3,
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                {t(`chooseUs.items.${selectedItem}.details`)}
              </Typography>

              {/* Lista de features cu checkmark-uri verzi */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {t(`chooseUs.items.${selectedItem}.features`, { returnObjects: true }).map((feature, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: checkBg,
                        flexShrink: 0
                      }}
                    >
                      <FiCheck size={14} color="#ffffff" strokeWidth={3} />
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: descColor,
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </section>
  );
}

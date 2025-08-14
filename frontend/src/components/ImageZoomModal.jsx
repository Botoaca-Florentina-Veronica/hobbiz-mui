import React, { useState, useEffect } from 'react';
import './ImageZoomModal.css';
import { 
  Modal, 
  IconButton, 
  Box, 
  Typography, 
  Paper, 
  Fade, 
  Backdrop,
  Button,
  Stack
} from '@mui/material';
import { 
  Close as CloseIcon, 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon, 
  ChevronLeft, 
  ChevronRight,
  Fullscreen as FullscreenIcon,
  RestartAlt as ResetIcon,
  Search as SearchIcon,
  RotateRight as RotateRightIcon
} from '@mui/icons-material';

export default function ImageZoomModal({ open, images, index, onClose, onPrev, onNext }) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0); // degrees: 0, 90, 180, 270

  const handleZoomIn = () => setZoom(z => (z >= 4 ? 1 : Math.min(z + 0.25, 4)));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => { setZoom(1); setRotation(0); };
  const handleWheel = e => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') return onClose?.();
      if (key === 'arrowleft' && images?.length > 1) return onPrev?.();
      if (key === 'arrowright' && images?.length > 1) return onNext?.();
      if (key === '+' || key === '=' ) return handleZoomIn();
      if (key === '-') return handleZoomOut();
      if (key === '0') return handleResetZoom();
      if (key === 'f') return toggleFullscreen();
      if (key === 'r') return handleRotate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images?.length, onClose, onPrev, onNext]);

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: { bgcolor: 'rgba(0, 0, 0, 0.85)' }
      }}
    >
      <Fade in={open}>
        <Box className="image-zoom-modal-overlay" sx={{
          position: 'fixed', inset: 0, width: '100%', height: '100%',
          display: 'grid', placeItems: 'center', outline: 'none', overflow: 'hidden', boxSizing: 'border-box'
        }}>
          {/* Container to anchor arrows and card */}
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Card */}
            <Paper elevation={0} sx={{
              position: 'relative',
              bgcolor: '#fff', borderRadius: 3, overflow: 'hidden',
              width: isFullscreen ? 'min(96vw, 1280px)' : 'min(88vw, 1000px)',
              height: isFullscreen ? 'min(88vh, 900px)' : 'min(70vh, 720px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
            }}>
              {/* Close inside card for symmetry */}
              <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, width: 36, height: 36, color: 'black', bgcolor: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.15)', zIndex: 3, '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
                <CloseIcon />
              </IconButton>
              {/* Inner arrows for symmetry */}
              {images.length > 1 && (
                <IconButton onClick={onPrev} sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                  <ChevronLeft />
                </IconButton>
              )}
              {images.length > 1 && (
                <IconButton onClick={onNext} sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                  <ChevronRight />
                </IconButton>
              )}
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', position: 'relative', zIndex: 1 }}>
                <img
                  src={images[index]}
                  alt={`Imagine ${index + 1} din ${images.length}`}
                  style={{ maxWidth: '100%', maxHeight: '100%', transform: `rotate(${rotation}deg) scale(${zoom})`, transition: 'transform 0.25s ease', cursor: zoom > 1 ? 'grab' : 'zoom-in', objectFit: 'contain' }}
                  onClick={handleZoomIn}
                  onWheel={handleWheel}
                  draggable={false}
                />
              </Box>
            </Paper>

            {/* Bottom toolbar - symmetric grid */}
            <Box sx={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
              bgcolor: 'rgba(0,0,0,0.78)', color: 'white', px: 2, py: 1, borderRadius: 1.5,
              width: isFullscreen ? 'min(96vw, 1280px)' : 'min(88vw, 1000px)', gap: 2,
              border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)'
            }}>
              {/* Prev */}
              <Stack direction="row" alignItems="center" spacing={1}>
              </Stack>

              {/* Zoom + Counter (center) */}
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ justifySelf: 'center' }}>
                <SearchIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                <Typography sx={{ color: 'white', minWidth: 56, textAlign: 'center' }}>{Math.round(zoom * 100)}%</Typography>
                <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5} sx={{ color: 'white', width: 36, height: 36, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1 }}>
                  <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={handleRotate} sx={{ color: 'white', width: 36, height: 36, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1 }}>
                  <RotateRightIcon />
                </IconButton>
                <IconButton onClick={handleZoomIn} sx={{ color: 'white', width: 36, height: 36, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1 }}>
                  <ZoomInIcon />
                </IconButton>
                {images.length > 1 && (
                  <Typography sx={{ color: 'white', opacity: 0.9, ml: 1 }}>• {index + 1} / {images.length} •</Typography>
                )}
              </Stack>

              {/* Fullscreen (end) */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ justifySelf: 'end' }}>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white', width: 36, height: 36, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1 }}>
                  <FullscreenIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Side arrows removed; now inside Paper for symmetry */}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

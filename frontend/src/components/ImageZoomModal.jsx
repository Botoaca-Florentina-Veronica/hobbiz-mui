import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  // Panning state (desktop only)
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // current translate offset
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = () => {
    setZoom(z => Math.min(z + 0.25, 4));
  };
  const handleZoomOut = () => {
    setZoom(z => Math.max(z - 0.25, 0.5));
  };
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // When zoom changes, clamp offset to bounds and reset when not zoomed in
  useEffect(() => {
    if (zoom <= 1) {
      setOffset({ x: 0, y: 0 });
    } else {
      // Clamp to bounds
      const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
      const container = containerRef.current;
      if (!container) return;
      const isRotated = rotation % 180 !== 0;
      const cw = isRotated ? container.clientHeight : container.clientWidth;
      const ch = isRotated ? container.clientWidth : container.clientHeight;
      const scaledW = cw * zoom;
      const scaledH = ch * zoom;
      const maxX = Math.max(0, (scaledW - cw) / 2);
      const maxY = Math.max(0, (scaledH - ch) / 2);
      setOffset(prev => ({ x: clamp(prev.x, -maxX, maxX), y: clamp(prev.y, -maxY, maxY) }));
    }
  }, [zoom, rotation]);

  // Mouse handlers for dragging
  const onMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...offset };
  }, [zoom, offset]);

  const onMouseMove = useCallback((e) => {
    if (!isPanning || !containerRef.current) return;
    const container = containerRef.current;
    const isRotated = rotation % 180 !== 0;
    const cw = isRotated ? container.clientHeight : container.clientWidth;
    const ch = isRotated ? container.clientWidth : container.clientHeight;
    const scaledW = cw * zoom;
    const scaledH = ch * zoom;
    const maxX = Math.max(0, (scaledW - cw) / 2);
    const maxY = Math.max(0, (scaledH - ch) / 2);

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    setOffset({
      x: clamp(startOffsetRef.current.x + dx, -maxX, maxX),
      y: clamp(startOffsetRef.current.y + dy, -maxY, maxY)
    });
  }, [isPanning, zoom]);

  const endPan = useCallback(() => setIsPanning(false), []);

  // Keyboard controls (zoom only via toolbar or keyboard; image does not zoom)
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
              <Box
                ref={containerRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={endPan}
                onMouseLeave={endPan}
                sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', position: 'relative', zIndex: 1, cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              >
                <img
                  src={images[index]}
                  alt={`Imagine ${index + 1} din ${images.length}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `rotate(${rotation}deg) scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                    transition: isPanning ? 'none' : 'transform 0.25s ease',
                    objectFit: 'contain',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
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

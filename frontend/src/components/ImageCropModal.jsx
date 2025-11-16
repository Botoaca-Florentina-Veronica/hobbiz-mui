import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  CircularProgress,
  Slider,
  Box,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  CropFree as CropIcon
} from '@mui/icons-material';
import './ImageCropModal.css';

export default function ImageCropModal({ open, onClose, currentImage, onSave, uploading, onDelete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentImage || null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetY, setOffsetY] = useState(0); // vertical position offset for crop zone
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (open && currentImage) {
      setPreviewUrl(currentImage);
      // Reset zoom, rotation, and offset when opening with existing image
      // so user always sees the full image and can re-select crop area
      setZoom(1);
      setRotation(0);
      setOffsetY(0);
    }
  }, [open, currentImage]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartY(e.clientY - offsetY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newOffsetY = e.clientY - dragStartY;
    setOffsetY(newOffsetY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartY]);

  const handleApply = async () => {
    if (!previewUrl) return;

    try {
      // Create image element to measure sizes
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const coverWidth = 800;
        const coverHeight = 200;

        // Handle rotation by drawing the rotated source into a temp canvas first
        const rotRad = (rotation * Math.PI) / 180;
        const isRotated90 = Math.abs(rotation % 180) === 90;

        let srcCanvas = document.createElement('canvas');
        let srcCtx = srcCanvas.getContext('2d');

        if (rotation % 360 !== 0) {
          // If rotated, swap dimensions accordingly
          srcCanvas.width = isRotated90 ? img.height : img.width;
          srcCanvas.height = isRotated90 ? img.width : img.height;
          srcCtx.save();
          srcCtx.translate(srcCanvas.width / 2, srcCanvas.height / 2);
          srcCtx.rotate(rotRad);
          srcCtx.drawImage(img, -img.width / 2, -img.height / 2);
          srcCtx.restore();
        } else {
          srcCanvas.width = img.width;
          srcCanvas.height = img.height;
          srcCtx.drawImage(img, 0, 0);
        }

        const naturalW = srcCanvas.width;
        const naturalH = srcCanvas.height;

        // Measurements from preview DOM
        const imgEl = imageRef.current;
        const container = imgEl?.parentElement;
        if (!imgEl || !container) {
          console.error('Preview elements missing');
          return;
        }

        const displayedW = imgEl.clientWidth;
        const displayedH = imgEl.clientHeight;
        const containerH = container.clientHeight;

        // scale to map displayed pixels -> natural pixels
        const scale = naturalW / displayedW;

        // crop zone (in displayed px). We keep it 200px high (as in CSS calc)
        const cropDisplayedHeight = 200;
        const cropTop = containerH / 2 - cropDisplayedHeight / 2;

        // starting top of image inside container (accounting for centering and user offset)
        const imgTopDefault = (containerH - displayedH) / 2;
        const currentImgTop = imgTopDefault + offsetY;

        // source Y in natural pixels
        let sourceY = (cropTop - currentImgTop) * scale;
        const sourceH = cropDisplayedHeight * scale;

        // Choose source width to match target aspect ratio
        const targetAspect = coverWidth / coverHeight;
        const naturalAspect = naturalW / naturalH;
        let sx = 0;
        let sw = naturalW;
        if (naturalAspect > targetAspect) {
          sw = naturalH * targetAspect;
          sx = Math.max(0, (naturalW - sw) / 2);
        }

        // clamp sourceY
        sourceY = Math.max(0, Math.min(naturalH - sourceH, sourceY));

        // final canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = coverWidth;
        outCanvas.height = coverHeight;
        const outCtx = outCanvas.getContext('2d');

        outCtx.drawImage(
          srcCanvas,
          sx, sourceY, sw, sourceH,
          0, 0, coverWidth, coverHeight
        );

        outCanvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], selectedFile?.name || 'cover.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            await onSave(file);
            handleClose();
          }
        }, 'image/jpeg', 0.95);
      };

      img.src = previewUrl;
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImage || null);
    setZoom(1);
    setRotation(0);
    setOffsetY(0);
    setIsDragging(false);
    onClose();
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  // Show confirm dialog when user requests delete
  const handleDeletePhoto = () => {
    setConfirmDeleteOpen(true);
  };

  const performDelete = async () => {
    setConfirmDeleteOpen(false);
    // clear local preview
    setPreviewUrl(null);
    setSelectedFile(null);
    setZoom(1);
    setRotation(0);
    setOffsetY(0);
    setIsDragging(false);

    // if parent provided an onDelete handler, call it so the deletion can be persisted
    if (typeof onDelete === 'function') {
      try {
        await onDelete();
      } catch (err) {
        // parent should handle errors; log for debugging
        console.error('onDelete handler threw:', err);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'image-crop-modal'
      }}
    >
      <div className="image-crop-header">
        <Typography variant="h6" className="image-crop-title">
          Cover image
        </Typography>
        <IconButton onClick={handleClose} className="image-crop-close-btn">
          <CloseIcon />
        </IconButton>
      </div>

      <DialogContent className="image-crop-content">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Image preview with highlighted crop zone */}
        <div className="image-crop-preview-container">
          {previewUrl ? (
            <div 
              className="image-crop-preview-full"
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <img 
                ref={imageRef}
                src={previewUrl} 
                alt="Preview"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translateY(${offsetY}px)`,
                }}
                draggable={false}
              />
              {/* Top darkened area */}
              <div className="crop-overlay crop-overlay-top"></div>
              {/* Bottom darkened area */}
              <div className="crop-overlay crop-overlay-bottom"></div>
              {/* Highlighted zone bars */}
              <div className="crop-zone-bar crop-zone-bar-top"></div>
              <div className="crop-zone-bar crop-zone-bar-bottom"></div>
            </div>
          ) : (
            <div className="image-crop-placeholder">
              <Typography>No image selected</Typography>
            </div>
          )}
        </div>

        {/* Toolbar - removed Adjust button */}
        <div className="image-crop-toolbar">
          <button className="image-crop-tool-btn active">
            <CropIcon />
            <span>Crop</span>
          </button>
        </div>

        {/* Rotation controls */}
        <div className="image-crop-rotation-controls">
          <IconButton onClick={handleRotateLeft} className="rotation-btn">
            <RotateLeftIcon />
          </IconButton>
          <IconButton onClick={handleRotateRight} className="rotation-btn">
            <RotateRightIcon />
          </IconButton>
        </div>

        {/* Crop controls - only zoom, removed straighten */}
        <div className="image-crop-controls">
          <div className="image-crop-control-group">
            <Typography className="control-label">Zoom</Typography>
            <div className="slider-container">
              <button className="slider-btn" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                −
              </button>
              <Slider
                value={zoom}
                onChange={(e, val) => setZoom(val)}
                min={0.5}
                max={3}
                step={0.1}
                className="image-crop-slider"
              />
              <button className="slider-btn" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="image-crop-actions">
          <Button
            variant="outlined"
            onClick={handleDeletePhoto}
            className="image-crop-delete-btn"
            disabled={!previewUrl}
          >
            Delete photo
          </Button>
          <div className="image-crop-actions-right">
            <Button
              variant="outlined"
              onClick={handleChangePhoto}
              className="image-crop-change-btn"
            >
              Change photo
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              className="image-crop-apply-btn"
              disabled={!previewUrl || uploading}
            >
              {uploading ? <CircularProgress size={20} /> : 'Apply'}
            </Button>
          </div>
        </div>
        {/* Confirm delete dialog */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          PaperProps={{ className: 'confirm-delete-dialog' }}
        >
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogContent>
            <Typography>Esti sigur(ă) că vrei să ștergi poza de copertă? Această acțiune nu poate fi anulată.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={performDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

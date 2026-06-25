import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  IconButton
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import './AvailabilityBooking.css';

function toDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isSameDay(a, b) {
  return toDateStr(a) === toDateStr(b);
}

// Widget de disponibilitate + cerere de rezervare slot, afișat pe profilul public al unui prestator
export default function AvailabilityBooking({ providerId, isAuthenticated, onRequireLogin, onSuccess, onError }) {
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogSlot, setDialogSlot] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const from = toDateStr(days[0]);
  const to = toDateStr(days[days.length - 1]);

  const fetchSlots = async () => {
    try {
      const res = await apiClient.get(`/api/bookings/availability/${providerId}?from=${from}&to=${to}`);
      return res.data?.slots || [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const fetched = await fetchSlots();
      if (!active) return;
      setSlots(fetched);
      const firstDayWithSlots = days.find((d) => fetched.some((s) => s.date === toDateStr(d)));
      setSelectedDate(firstDayWithSlots ? toDateStr(firstDayWithSlots) : toDateStr(days[0]));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [providerId]);

  const locale = i18n?.language === 'en' ? 'en-US' : (i18n?.language === 'es' ? 'es-ES' : 'ro-RO');
  const slotsByDate = (dateStr) => slots.filter((s) => s.date === dateStr);
  const today = days[0];

  if (!loading && slots.length === 0) return null;

  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    setMessage('');
    setDialogSlot(slot);
  };

  const handleConfirm = async () => {
    if (!dialogSlot) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/bookings', {
        providerId,
        date: dialogSlot.date,
        startTime: dialogSlot.startTime,
        endTime: dialogSlot.endTime,
        message: message || undefined,
      });
      setDialogSlot(null);
      onSuccess?.(res.data);
      setSlots(await fetchSlots());
    } catch (err) {
      if (err?.response?.status === 409) {
        onError?.(t('publicProfile.availability.conflictError'));
        setDialogSlot(null);
        setSlots(await fetchSlots());
      } else {
        onError?.(t('publicProfile.availability.requestError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="pp-card pp-availability">
      <div className="pp-availability-head">
        <div className="pp-availability-head-icon"><EventAvailableIcon /></div>
        <div>
          <h2 className="pp-card-title">{t('publicProfile.availability.title')}</h2>
          <p className="pp-availability-subtitle">{t('publicProfile.availability.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="pp-availability-skeleton">
          <div className="pp-availability-days">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="pp-skel pp-skel-day" />)}
          </div>
          <div className="pp-availability-slots">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="pp-skel pp-skel-slot" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="pp-availability-days">
            {days.map((d) => {
              const dateStr = toDateStr(d);
              if (slotsByDate(dateStr).length === 0) return null;
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`pp-availability-day-chip ${selectedDate === dateStr ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className="pp-day-chip-weekday">
                    {isSameDay(d, today) ? t('publicProfile.availability.today') : d.toLocaleDateString(locale, { weekday: 'short' })}
                  </span>
                  <span className="pp-day-chip-date">{d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                </button>
              );
            })}
          </div>
          <div className="pp-availability-slots">
            {slotsByDate(selectedDate).map((slot) => (
              <button
                key={`${slot.date}-${slot.startTime}`}
                type="button"
                className={`pp-availability-slot-chip ${!slot.available ? 'unavailable' : ''}`}
                disabled={!slot.available}
                onClick={() => handleSlotClick(slot)}
              >
                {slot.startTime}
              </button>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={!!dialogSlot}
        onClose={() => !submitting && setDialogSlot(null)}
        fullWidth
        maxWidth="sm"
        className="pp-booking-dialog"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('publicProfile.availability.confirmTitle')}
          <IconButton size="small" onClick={() => setDialogSlot(null)} disabled={submitting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogSlot && (
            <div className="pp-booking-slot-summary">
              <AccessTimeIcon className="pp-booking-slot-summary-icon" />
              <div>
                <div className="pp-booking-slot-summary-date">
                  {new Date(`${dialogSlot.date}T00:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="pp-booking-slot-summary-time">{dialogSlot.startTime} – {dialogSlot.endTime}</div>
              </div>
            </div>
          )}
          <TextField
            label={t('publicProfile.availability.messageLabel')}
            fullWidth
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('publicProfile.availability.messagePlaceholder')}
            sx={{ mt: 2.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogSlot(null)} disabled={submitting} sx={{ borderRadius: 2 }}>
            {t('publicProfile.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={submitting}
            startIcon={submitting ? null : <SendIcon />}
            sx={{ borderRadius: 2 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : t('publicProfile.availability.sendRequest')}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}

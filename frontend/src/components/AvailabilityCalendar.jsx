import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import './AvailabilityCalendar.css';

function getMonthWeeks(year, month) {
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Luni=0 ... Duminică=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Calendar lunar curent, evidențiază ziua de azi și zilele cu program de disponibilitate activ
export default function AvailabilityCalendar({ weeklySchedule = [], enabled = false }) {
  const { t, i18n } = useTranslation();
  const locale = i18n?.language === 'en' ? 'en-US' : (i18n?.language === 'es' ? 'es-ES' : 'ro-RO');

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const availableDaysOfWeek = useMemo(
    () => new Set((enabled ? weeklySchedule : []).map((s) => s.dayOfWeek)),
    [weeklySchedule, enabled]
  );
  const monthLabel = today.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1); // o zi de luni, fixă, doar pentru a deriva etichetele zilelor
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'short' });
    });
  }, [locale]);

  return (
    <section className="profile-availability-calendar-card">
      <div className="profile-availability-title-group">
        <div className="profile-availability-icon"><CalendarMonthIcon /></div>
        <div>
          <h2 className="profile-info-main-title">{t('profile.availability.calendarTitle')}</h2>
          <p className="availability-calendar-subtitle">{monthLabel}</p>
        </div>
      </div>
      <hr className="profile-divider" />

      <div className="availability-calendar-weekdays">
        {weekdayLabels.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="availability-calendar-grid">
        {weeks.map((week, wi) => (
          <div className="availability-calendar-row" key={wi}>
            {week.map((day, di) => {
              if (day == null) {
                return <div className="availability-calendar-cell empty" key={di} />;
              }
              const dayOfWeek = new Date(year, month, day).getDay();
              const isToday = day === today.getDate();
              const isAvailable = availableDaysOfWeek.has(dayOfWeek);
              return (
                <div
                  className={`availability-calendar-cell ${isAvailable ? 'available' : ''}`}
                  key={di}
                >
                  <span className={`availability-calendar-day-num ${isToday ? 'today' : ''}`}>{day}</span>
                  {isAvailable && <span className="availability-calendar-dot" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {enabled && availableDaysOfWeek.size > 0 && (
        <div className="availability-calendar-legend">
          <span className="availability-calendar-dot" />
          {t('profile.availability.calendarLegend')}
        </div>
      )}
    </section>
  );
}

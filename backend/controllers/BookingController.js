// controllers/BookingController.js
const Booking = require('../models/Booking');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { encrypt, decrypt } = require('../services/encryptionService');

const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000; // 2 ore - cerere de ultim moment, nu permitem

function toDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function toHHmm(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// GET /api/bookings/availability/:providerId?from=YYYY-MM-DD&to=YYYY-MM-DD (public)
exports.getAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    let { from, to } = req.query;

    if (!from) from = toDateStr(new Date());
    if (!to) {
      const d = new Date(`${from}T00:00:00`);
      d.setDate(d.getDate() + 14);
      to = toDateStr(d);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({ message: 'Format dată invalid, folosește YYYY-MM-DD' });
    }

    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);
    const diffDays = Math.round((toDate - fromDate) / 86400000);
    if (isNaN(diffDays) || diffDays < 0 || diffDays > 30) {
      return res.status(400).json({ message: 'Intervalul cerut este invalid (maxim 30 de zile)' });
    }

    const provider = await User.findById(providerId).select('availability');
    if (!provider || !provider.availability || !provider.availability.enabled || !provider.availability.weeklySchedule?.length) {
      return res.json({ slots: [] });
    }

    const { slotDurationMinutes, weeklySchedule } = provider.availability;
    const scheduleByDay = new Map(weeklySchedule.map((d) => [d.dayOfWeek, d]));

    const minStart = new Date(Date.now() + MIN_LEAD_TIME_MS);

    const existingBookings = await Booking.find({
      provider: providerId,
      date: { $gte: from, $lte: to },
      status: { $in: ['pending', 'accepted'] },
    }).select('date startTime');
    const bookedSet = new Set(existingBookings.map((b) => `${b.date}|${b.startTime}`));

    const slots = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const daySchedule = scheduleByDay.get(cursor.getDay());
      if (daySchedule) {
        const dateStr = toDateStr(cursor);
        const dayStartMin = toMinutes(daySchedule.startTime);
        const dayEndMin = toMinutes(daySchedule.endTime);
        for (let startMin = dayStartMin; startMin + slotDurationMinutes <= dayEndMin; startMin += slotDurationMinutes) {
          const startTime = toHHmm(startMin);
          const endTime = toHHmm(startMin + slotDurationMinutes);
          const slotStartDate = new Date(`${dateStr}T${startTime}:00`);
          if (slotStartDate < minStart) continue;
          slots.push({
            date: dateStr,
            startTime,
            endTime,
            available: !bookedSet.has(`${dateStr}|${startTime}`),
          });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ slots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/bookings (auth)
exports.createBooking = async (req, res) => {
  try {
    const { providerId, date, startTime, endTime, message } = req.body;
    const clientId = req.userId;

    if (!providerId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'providerId, date, startTime și endTime sunt obligatorii' });
    }

    if (String(providerId) === String(clientId)) {
      return res.status(400).json({ message: 'Nu poți face o rezervare la propriul profil' });
    }

    const provider = await User.findById(providerId).select('availability firstName lastName pushToken notificationSettings');
    if (!provider) {
      return res.status(404).json({ message: 'Prestator inexistent' });
    }
    if (!provider.availability || !provider.availability.enabled) {
      return res.status(400).json({ message: 'Acest prestator nu are disponibilitate activă' });
    }

    // Re-derivă validitatea slotului din programul curent - nu avem încredere în ce trimite clientul
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const daySchedule = (provider.availability.weeklySchedule || []).find((d) => d.dayOfWeek === dayOfWeek);
    const slotDuration = provider.availability.slotDurationMinutes;
    if (!daySchedule) {
      return res.status(400).json({ message: 'Prestatorul nu este disponibil în această zi' });
    }

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    const dayStartMin = toMinutes(daySchedule.startTime);
    const dayEndMin = toMinutes(daySchedule.endTime);
    const isValidSlot =
      endMin - startMin === slotDuration &&
      startMin >= dayStartMin &&
      endMin <= dayEndMin &&
      (startMin - dayStartMin) % slotDuration === 0;
    if (!isValidSlot) {
      return res.status(400).json({ message: 'Acest interval nu mai este disponibil în programul prestatorului' });
    }

    const slotStart = new Date(`${date}T${startTime}:00`);
    if (isNaN(slotStart.getTime()) || slotStart.getTime() < Date.now() + MIN_LEAD_TIME_MS) {
      return res.status(400).json({ message: 'Intervalul cerut este în trecut sau prea apropiat de momentul actual' });
    }

    const conflict = await Booking.findOne({
      provider: providerId,
      date,
      startTime,
      status: { $in: ['pending', 'accepted'] },
    });
    if (conflict) {
      return res.status(409).json({ message: 'Acest interval a fost rezervat de altcineva, alege un alt slot' });
    }

    const booking = await new Booking({
      provider: providerId,
      client: clientId,
      date,
      startTime,
      endTime,
      message: message || undefined,
      status: 'pending',
    }).save();

    const conversationId = [String(providerId), String(clientId)].sort().join('-');
    const summaryText = `Cerere de rezervare: ${date}, ${startTime} - ${endTime}${message ? '\n' + String(message) : ''}`;

    const chatMessage = await new Message({
      conversationId,
      senderId: clientId,
      senderRole: 'cumparator',
      destinatarId: providerId,
      text: encrypt(summaryText),
      messageType: 'booking_request',
      bookingData: {
        bookingId: String(booking._id),
        providerId: String(providerId),
        date,
        startTime,
        endTime,
        status: 'pending',
      },
    }).save();

    booking.messageId = chatMessage._id;
    await booking.save();

    const msgResponse = chatMessage.toObject();
    msgResponse.text = decrypt(msgResponse.text);

    try {
      const io = req.app.get('io');
      if (io) {
        const clientUser = await User.findById(clientId).select('firstName lastName avatar');
        const senderInfo = clientUser
          ? { firstName: clientUser.firstName, lastName: clientUser.lastName, avatar: clientUser.avatar }
          : null;
        io.to('user:' + String(providerId)).emit('newMessage', { ...msgResponse, senderInfo });
        io.to('user:' + String(clientId)).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (_) {}

    (async () => {
      try {
        const clientUser = await User.findById(clientId).select('firstName lastName');
        const clientName = clientUser ? (`${clientUser.firstName || ''} ${clientUser.lastName || ''}`).trim() || 'Utilizator' : 'Utilizator';
        const notifMessage = `${clientName} a cerut o rezervare pe ${date} la ${startTime}`;

        await Notification.create({
          userId: providerId,
          message: notifMessage,
          link: '/chat',
          type: 'booking',
          fromUserId: clientId,
          actionDescription: 'a cerut o rezervare',
        });

        const io = req.app.get('io');
        if (io) io.to('user:' + String(providerId)).emit('newNotification', { userId: providerId });

        const settings = provider.notificationSettings || {};
        const allowPush = settings.push !== false;
        let tokens = Array.isArray(provider.pushToken) ? provider.pushToken : (provider.pushToken ? [provider.pushToken] : []);
        tokens = tokens.filter((t) => /^ExponentPushToken\[.+\]$/.test(t));
        if (allowPush && tokens.length > 0) {
          const doFetch = (url, opts) => (typeof fetch !== 'undefined' ? fetch(url, opts) : require('node-fetch')(url, opts));
          await doFetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: tokens,
              title: 'Cerere de rezervare',
              body: notifMessage.slice(0, 120),
              priority: 'high',
              sound: 'default',
            }),
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('Eroare la crearea notificării pentru booking:', e?.message || e);
      }
    })();

    res.status(201).json({ booking, message: msgResponse });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/bookings/:id/respond (auth, doar provider)
exports.respondBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { accept } = req.body || {};
    const userId = req.userId;

    if (typeof accept !== 'boolean') {
      return res.status(400).json({ message: 'Parametrul accept trebuie să fie boolean' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Rezervarea nu a fost găsită' });
    }
    if (String(booking.provider) !== String(userId)) {
      return res.status(403).json({ message: 'Doar prestatorul poate răspunde la această cerere' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Această cerere a fost deja procesată' });
    }

    booking.status = accept ? 'accepted' : 'rejected';
    booking.respondedAt = new Date();
    await booking.save();

    const messageResponse = await applyBookingStatusToMessage(booking);

    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          messageId: booking.messageId ? String(booking.messageId) : null,
          conversationId: messageResponse?.conversationId,
          bookingId: String(booking._id),
          bookingData: { status: booking.status },
        };
        io.to('user:' + String(booking.provider)).emit('bookingUpdated', payload);
        io.to('user:' + String(booking.client)).emit('bookingUpdated', payload);
      }
    } catch (_) {}

    (async () => {
      try {
        const notifMessage = accept
          ? `Prestatorul a acceptat cererea ta de rezervare din ${booking.date}`
          : `Prestatorul a respins cererea ta de rezervare din ${booking.date}`;
        await Notification.create({
          userId: booking.client,
          message: notifMessage,
          link: '/chat',
          type: 'booking',
          fromUserId: booking.provider,
          actionDescription: accept ? 'a acceptat rezervarea' : 'a respins rezervarea',
        });
        const io = req.app.get('io');
        if (io) io.to('user:' + String(booking.client)).emit('newNotification', { userId: booking.client });
      } catch (_) {}
    })();

    res.json({ booking, message: messageResponse });
  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/bookings/:id/cancel (auth, provider sau client)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Rezervarea nu a fost găsită' });
    }
    const isParticipant = [String(booking.provider), String(booking.client)].includes(String(userId));
    if (!isParticipant) {
      return res.status(403).json({ message: 'Nu ești parte în această rezervare' });
    }
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ message: 'Această rezervare nu mai poate fi anulată' });
    }

    booking.status = 'cancelled';
    booking.respondedAt = new Date();
    await booking.save();

    const messageResponse = await applyBookingStatusToMessage(booking);

    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          messageId: booking.messageId ? String(booking.messageId) : null,
          conversationId: messageResponse?.conversationId,
          bookingId: String(booking._id),
          bookingData: { status: 'cancelled' },
        };
        io.to('user:' + String(booking.provider)).emit('bookingUpdated', payload);
        io.to('user:' + String(booking.client)).emit('bookingUpdated', payload);
      }
    } catch (_) {}

    const otherPartyId = String(userId) === String(booking.provider) ? booking.client : booking.provider;
    (async () => {
      try {
        await Notification.create({
          userId: otherPartyId,
          message: `Rezervarea din ${booking.date} la ${booking.startTime} a fost anulată`,
          link: '/chat',
          type: 'booking',
          fromUserId: userId,
          actionDescription: 'a anulat rezervarea',
        });
        const io = req.app.get('io');
        if (io) io.to('user:' + String(otherPartyId)).emit('newNotification', { userId: otherPartyId });
      } catch (_) {}
    })();

    res.json({ booking, message: messageResponse });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Actualizează in-place mesajul de chat asociat unui booking, ca să reflecte noul status
async function applyBookingStatusToMessage(booking) {
  if (!booking.messageId) return null;
  const chatMessage = await Message.findById(booking.messageId);
  if (!chatMessage) return null;
  chatMessage.bookingData = chatMessage.bookingData || {};
  chatMessage.bookingData.status = booking.status;
  await chatMessage.save();
  const messageResponse = chatMessage.toObject();
  if (messageResponse.text) messageResponse.text = decrypt(messageResponse.text);
  return messageResponse;
}

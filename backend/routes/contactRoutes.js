const express = require('express');
const router = express.Router();
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const xss = require('xss');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const optionalAuth = require('../middleware/optionalAuth');
const ContactFallbackMessage = require('../models/ContactFallbackMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// POST /api/contact
// Body: { name, email, message }
// Trimite mesajul utilizatorului pe adresa oficială a aplicației
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }

    const cleanName    = xss(String(name).trim()).slice(0, 100);
    const cleanEmail   = xss(String(email).trim()).slice(0, 200);
    const cleanMessage = xss(String(message).trim()).slice(0, 3000);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Adresa de email nu este validă.' });
    }

    if (!process.env.MAILERSEND_API_KEY || !process.env.SENDER_EMAIL) {
      console.error('[Contact] MailerSend not configured');
      return res.status(500).json({ error: 'Serviciul de email nu este configurat momentan.' });
    }

    const appName   = process.env.APP_NAME || 'Hobbiz';
    const sentFrom  = new Sender(process.env.SENDER_EMAIL, appName);
    const replyTo   = new Sender(cleanEmail, cleanName);
    const contactRecipient = process.env.CONTACT_RECIPIENT_EMAIL || 'team.hobbiz@gmail.com';
    const recipients = [new Recipient(contactRecipient, 'Echipa Hobbiz')];

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#f51866;">Mesaj nou de contact – ${appName}</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="padding:8px; font-weight:bold; width:120px;">Nume:</td>
            <td style="padding:8px;">${cleanName}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:8px; font-weight:bold;">Email:</td>
            <td style="padding:8px;"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:8px; font-weight:bold; vertical-align:top;">Mesaj:</td>
            <td style="padding:8px; white-space:pre-line;">${cleanMessage}</td>
          </tr>
        </table>
        <hr style="margin-top:24px;"/>
        <p style="color:#888; font-size:12px;">Trimis prin formularul de contact de pe platforma ${appName}.</p>
      </div>
    `;

    const textBody = `Mesaj nou de contact\n\nNume: ${cleanName}\nEmail: ${cleanEmail}\n\nMesaj:\n${cleanMessage}`;

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(replyTo)
      .setSubject(`[${appName}] Mesaj de contact de la ${cleanName} <${cleanEmail}>`)
      .setHtml(htmlBody)
      .setText(textBody);

    await mailerSend.email.send(emailParams);
    console.log(`[Contact] Email trimis de la ${cleanEmail} (${cleanName})`);

    res.json({ success: true, message: 'Mesajul tău a fost trimis cu succes!' });
  } catch (err) {
    console.error('[Contact] Eroare la trimiterea emailului:', err?.message || err);
    if (err?.response?.body) {
      console.error('[Contact] MailerSend body:', JSON.stringify(err.response.body));
    }
    try {
      const mailErrorMessage = err?.response?.body?.message || err?.message || 'MailerSend error';
      const mailErrorCode = err?.response?.status ? String(err.response.status) : undefined;
      const mailErrorRaw = err?.response?.body ? JSON.stringify(err.response.body) : undefined;
      const fallback = await ContactFallbackMessage.create({
        name: xss(String(req.body?.name || '').trim()).slice(0, 100),
        email: xss(String(req.body?.email || '').trim()).slice(0, 200),
        message: xss(String(req.body?.message || '').trim()).slice(0, 3000),
        userId: req.userId || undefined,
        mailError: {
          message: String(mailErrorMessage).slice(0, 500),
          code: mailErrorCode ? String(mailErrorCode).slice(0, 100) : undefined,
          raw: mailErrorRaw ? String(mailErrorRaw).slice(0, 2000) : undefined,
        },
        ip: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });

      try {
        const ADMIN_ID = '6808bf9a48e492acb8db7173';
        const admins = await User.find({ $or: [{ isAdmin: true }, { _id: ADMIN_ID }] }).select('_id');
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            message: `Mesaj de contact salvat (fallback) de la ${fallback.name}`,
            link: '/admin/contact-fallbacks',
            type: 'general',
          });
          try {
            const io = req.app.get('io');
            const activeUsers = req.app.get('activeUsers');
            if (io && activeUsers) {
              const sid = activeUsers.get(String(admin._id));
              if (sid) {
                io.to(sid).emit('newNotification', { userId: String(admin._id) });
              }
            }
          } catch (_) {}
        }
      } catch (notifError) {
        console.warn('[Contact] Eroare la notificarea adminilor:', notifError?.message || notifError);
      }

      return res.status(202).json({
        success: true,
        fallback: true,
        message: 'Mesajul tău a fost înregistrat și va fi preluat de echipă în curând.'
      });
    } catch (fallbackError) {
      console.error('[Contact] Eroare la salvarea fallback:', fallbackError?.message || fallbackError);
    }
    res.status(500).json({ error: 'Nu am putut trimite mesajul. Încearcă din nou mai târziu.' });
  }
});

// Admin: list fallback messages
router.get('/fallbacks', auth, adminAuth, async (req, res) => {
  try {
    const status = String(req.query.status || 'open');
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const query = status === 'all' ? {} : { status };
    const items = await ContactFallbackMessage
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ items });
  } catch (error) {
    console.error('[Contact] Eroare la listarea fallback-urilor:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut încărca mesajele.' });
  }
});

// Admin: resolve fallback
router.patch('/fallbacks/:id/resolve', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ContactFallbackMessage.findByIdAndUpdate(
      id,
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.userId },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Mesaj negăsit.' });
    res.json({ success: true, item });
  } catch (error) {
    console.error('[Contact] Eroare la rezolvare fallback:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut actualiza mesajul.' });
  }
});

module.exports = router;

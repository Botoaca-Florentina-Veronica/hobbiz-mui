const express = require('express');
const router = express.Router();
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const xss = require('xss');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// POST /api/contact
// Body: { name, email, message }
// Trimite mesajul utilizatorului pe adresa oficială a aplicației
router.post('/', async (req, res) => {
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
    const recipients = [new Recipient('team.hobbiz@gmail.com', 'Echipa Hobbiz')];

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
      .setReplyTo(new Sender(cleanEmail, cleanName))
      .setSubject(`[${appName}] Mesaj de contact de la ${cleanName}`)
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
    res.status(500).json({ error: 'Nu am putut trimite mesajul. Încearcă din nou mai târziu.' });
  }
});

module.exports = router;

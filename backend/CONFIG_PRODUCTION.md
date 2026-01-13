# Configurare Producție - Backend Hobbiz

## Variabile de Mediu Necesare

Pentru ca aplicația să funcționeze corect în producție (DigitalOcean, Render, etc.), trebuie să configurezi următoarele variabile de mediu:

### 1. Baza de Date MongoDB
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 2. Autentificare JWT
```
JWT_SECRET=<un-secret-puternic-random>
SESSION_SECRET=<alt-secret-puternic-random>
```

### 3. MailerSend (pentru resetarea parolei) ⚠️ IMPORTANT
```
MAILERSEND_API_KEY=mlsn.xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=no-reply@hobbiz.ro
```

**Cum obții aceste valori:**
1. Creează un cont pe [MailerSend](https://www.mailersend.com/)
2. Verifică domeniul tău (`hobbiz.ro` în acest caz)
3. Generează un API Key din dashboard
4. Folosește un email de la domeniul verificat ca `SENDER_EMAIL`

**FĂRĂ aceste variabile, resetarea parolei NU va funcționa!**

### 4. Cloudinary (pentru upload imagini)
```
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

### 5. Google OAuth (opțional, pentru login cu Google)
```
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://your-backend-url.com/api/auth/google/callback
```

### 6. Frontend URL
```
FRONTEND_URL=https://hobbiz.netlify.app
```

### 7. App Name
```
APP_NAME=Hobbiz
NODE_ENV=production
PORT=5000
```

## Verificare Configurare

Pentru a verifica dacă toate variabilele sunt setate corect, poți verifica logurile la pornirea serverului. Backend-ul va afișa:
```
🔍 DEBUG ENV VARS:
JWT_SECRET: ***SET***
MONGODB_URI: ***SET***
NODE_ENV: production
PORT: 5000
```

## Probleme Comune

### "Serviciul de email nu este configurat"
- Verifică că `MAILERSEND_API_KEY` și `SENDER_EMAIL` sunt setate
- Verifică că emailul sender este de la un domeniu verificat în MailerSend
- Verifică că API key-ul este valid și are permisiuni pentru trimitere email

### "Not allowed by CORS"
- Verifică că `FRONTEND_URL` este setat corect
- Backend-ul acceptă origini de la:
  - localhost (pentru development)
  - *.netlify.app
  - *.ondigitalocean.app
  - hobbiz-mui.onrender.com
  - Orice adresă LAN privată (192.168.x.x, 10.x.x.x, etc.)

### Resetarea parolei funcționează doar de pe propriul calculator
- **Cauza**: Variabilele de mediu MailerSend nu sunt configurate în producție
- **Soluție**: Configurează `MAILERSEND_API_KEY` și `SENDER_EMAIL` pe platforma de hosting
- Backend-ul din local funcționează pentru că fișierul `.env` local conține aceste valori
- În producție, trebuie să le setezi manual în panoul de configurare al platformei (DigitalOcean, Render, etc.)

## Deployment pe DigitalOcean App Platform

1. Mergi la Settings → App-Level Environment Variables
2. Adaugă toate variabilele de mai sus
3. Restart aplicația după ce ai salvat variabilele

## Deployment pe Render

1. Mergi la Dashboard → Environment
2. Adaugă toate variabilele de mai sus
3. Deploy-ul se va face automat după salvare

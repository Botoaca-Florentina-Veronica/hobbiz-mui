const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

function init() {
  if (initialized) return;
  // Expect a SERVICE_ACCOUNT env var pointing to JSON path or the JSON itself
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', 'firebase-service-account.json');
  try {
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    initialized = true;
  } catch (err) {
    console.warn('Could not initialize firebase-admin. Set FIREBASE_SERVICE_ACCOUNT_PATH or place firebase-service-account.json in backend/.', err.message);
  }
}

init();

async function sendToDevice(fcmToken, title, body, data = {}) {
  if (!initialized) throw new Error('firebase-admin not initialized');
  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {})
  };
  return admin.messaging().send(message);
}

async function sendToTopic(topic, title, body, data = {}) {
  if (!initialized) throw new Error('firebase-admin not initialized');
  const message = {
    topic,
    notification: { title, body },
    data: Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {})
  };
  return admin.messaging().send(message);
}

module.exports = { init, sendToDevice, sendToTopic };

const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { sendPushNotification, schedulePushNotification } = require('./fbno');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": "revol-734dd",
    "private_key_id": "318fc5f031e45bb149066173afbf2657aec1515f",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCr896w9CqWiboL\n9ZnRuII3oEmFnsB0vatg835RvPZrLuLiy5uiLmnkwddgwXs41vMeszZSKey8VqFg\nTa5oYZUMPfq1AZ8y+jOq/Dw93Ebr3uiG0TUyAXWIciZD18kiolfcDqCyGIgR86As\n3XuMuu0jclqTpU7KwBp6ZIkI3ZQ3q+uhxz285W4t6H7XHsDoKbhTglrcCHSrHoQ+\nM0+JhCtJsvkvTVny0fSfo005XL7ydOVLL4Qg73tG3vBguSZy9Fr3zkiX4CodMYJY\njy8eP7E8JqnaXmdsMKGNwIFUkxEuJc0jdybg0yOJcHpyjfr/LcfziE0nNt63U492\n+W5XYt2pAgMBAAECggEAGNDqBXNDlzS6yUGRiLsebe0/1x0tbNu3uVcC1sSU8qyS\nWYVliW814KoaDZB22mHpNffKwepjjF3bTeUAI/fbVSg3v7pDcc26ubVL82iQQrfJ\nqrVUPkqIHiBNRfLFSC6STAO/bNyN/LtClV8Elu+eTESTbmYH3EqDt8C9Jy6lVrBH\nsaR/QJfmmL4SXffV4V547acQad7FyX2pxd4E781pSmrgXk5r+G21fvbF44hGVOtu\nWsj+KVHF9tnGY7VzwBpEoY5U10KwbkuKpX421VH1Kmdmt78fa4+HotgBFrX6T3OT\n6NgB2dp7pofMqF9veVW9z6HNaBekDtVWUaixYmpORQKBgQDyU6ksYFzOmnAhx/l5\nhqLmmo0Y6P/EF0NVBvq7mCZs03PN+0zJ5umUyaStQugaCfvppYf/uOSdLH41P6Vt\nY5lKcAizAIxAAaQlj8PZMHnGf//t++PLDP4pHc+gM9aesZBXxp6bwKrpCq4zDbjn\nHbGrQJJNSI6fFFuWNO/VlSJG7QKBgQC1p6y6/0XFauuWsGT9gu4yn5Aya/z/5tz4\nbsKMB+A94ZgRLkGb7Qih98CpFt6xlVoBQ6a/TRDco1qgtoH4zLfLUd0NurBqS0xE\n/7cyPa203PsethR8L19QY6mdmS3viq5/oTRAnaXZlXZOLs/s+PBPhP4T5tR4i1KB\nobdzAws+LQKBgFsqvmrDlibkU2tiIKlnzcGUQ6Erh43ucpZ6mboZ89rdcqP791e+\nWAJyGlJU6Z1iRDQS4qeCl//JzXGbEFGnNvSaUauGeT1bYLYA8F21rxrO7SpLqdeq\ne7RcUtCisAvkIbnkL6fJRIOIUSFD+Fx6/2y+TkxlD8MplYtdPx3LjanBAoGAacFG\nVE+NRROsODxVbymslxhCELjBwBGdj5yb8n4bVKtjpozxcV+b6P+d0FMaLvSuQ5Ip\nH7I0IN+RQYM/Q6ObVOlB8l4/moJf0sO02bEC0grcv9JtNqc1rE15T+D/1zc7w94L\n15pwFa5oA7hJIMME1KaubNOz2sHxtLp7XJ/nCbkCgYBnugY3vbEEzhPCwp2j81O9\nlVU9KbuUHfB6WilOqs15zL/54Pl4d2OtPw0CeNj3sDpAM7r1/thQzZdSKVM2KfFP\n+VrUGQwdR07615BoyB4ozIJ7smLLlA1Vp20z8qYzZw9y7P6ee2vOIenyEqYcujGU\nLalbW0awHsnQOAMwhreKlg==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-t2qn1@revol-734dd.iam.gserviceaccount.com",
    "client_id": "105650427972045808029",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-t2qn1%40revol-734dd.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  })
});


const app = express();
app.use(bodyParser.json());

// Route to send push notification
app.post('/sendPushNotification', async (req, res) => {
  const { title, body, imageUrl, userId } = req.body;
  try {
    const response = await sendPushNotification(title, body, imageUrl, userId);
    return res.status(200).send(response);
  } catch (error) {
    console.error('Error sending push notification:', error);
    return res.status(500).send(`Error sending push notification: ${error.message}`);
  }
});

// Route to schedule push notification
app.post('/schedulePushNotification', (req, res) => {
  const { title, body, imageUrl, userId, scheduleTime } = req.body;
  try {
    schedulePushNotification(title, body, imageUrl, userId, new Date(scheduleTime));
    return res.status(200).send('Notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling push notification:', error);
    return res.status(500).send(`Error scheduling push notification: ${error.message}`);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

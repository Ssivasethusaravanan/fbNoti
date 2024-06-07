const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { sendPushNotification, schedulePushNotification } = require('./fbno');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, 'fb.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://revol-734dd-default-rtdb.firebaseio.com"
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

const admin = require('firebase-admin');
const schedule = require('node-schedule');
 

 
/**
 * Fetches the FCM registration token for a user from Firebase Realtime Database
 * @param {string} userId - The ID of the user to fetch the token for
 * @returns {Promise<string>} - A promise that resolves to the FCM registration token
 */
function getUserToken(userId) {
  return admin.database().ref(`Master/${userId}/fcm`).once('value')
    .then(snapshot => snapshot.val());
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 * @param {string} title - The title of the notification
 * @param {string} body - The body text of the notification
 * @param {string} imageUrl - The URL of the image to include in the notification (optional)
 * @param {string} userId - The ID of the user to fetch the token for
 */
async function sendPushNotification(title, body, imageUrl, userId) {
  try {
    const registrationToken = await getUserToken(userId);
    const message = {
      notification: {
        title: title,
        body: body,
        image: imageUrl, // imageUrl is optional
      },
      token: registrationToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Schedules a push notification using Firebase Cloud Messaging
 * @param {string} title - The title of the notification
 * @param {string} body - The body text of the notification
 * @param {string} imageUrl - The URL of the image to include in the notification (optional)
 * @param {string} userId - The ID of the user to fetch the token for
 * @param {Date} scheduleTime - The time to send the notification
 */
function schedulePushNotification(title, body, imageUrl, userId, scheduleTime) {
  schedule.scheduleJob(scheduleTime, async () => {
    await sendPushNotification(title, body, imageUrl, userId);
  });
  console.log(`Notification scheduled for ${scheduleTime}`);
}

module.exports = {
  sendPushNotification,
  schedulePushNotification,
};

const admin = require('firebase-admin');
const schedule = require('node-schedule');
 

 
/**
 * Fetches the FCM registration token for a user from Firebase Realtime Database
 * @param {string} userId - The ID of the user to fetch the token for
 * @returns {Promise<string>} - A promise that resolves to the FCM registration token
 */
// function getUserToken(userId) {
//   return admin.database().ref(`Master/Users/${userId}/FCM`).once('value')
//     .then(snapshot => snapshot.val());
// }
function getUserToken(userId) {
  return admin.database().ref(`Master/Users/${userId}/FCM`).once('value')
    .then(snapshot => {
      const data = snapshot.val();

      if (!data) return null;

      // If it's an array
      if (Array.isArray(data)) {
        return data; // first element
      }

      // If it's an object (key-value tokens)
      const values = Object.values(data);
      return values.length > 0 ? values[0] : null;
    });
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 * @param {string} title - The title of the notification
 * @param {string} body - The body text of the notification
 * @param {string} imageUrl - The URL of the image to include in the notification (optional)
 * @param {string} userId - The ID of the user to fetch the token for
 */
async function sendPushNotification(title, body, imageUrl, userId) {
    const responses = [];
  try {
    const registrationToken = await getUserToken(userId);
    console.log('Successfully sent message:', registrationToken);

for (const tokensForNoti of registrationToken) {
  try{
    const message = {
      notification: {
        title: title,
        body: body,
        image: imageUrl, // imageUrl is optional
      },
      android:{
        notification:{
        image:imageUrl,
        click_action:"FLUTTER_NOTIFICATION_CLICK",
         channel_id: "high_importance_channel_v2",
         sound:"noti"
        },
        priority:"HIGH"

      },

      data:{
        image:imageUrl
      },
      token: tokensForNoti,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message yes:', response);
         responses.push(response);
  }catch(ex){
  if (ex.message && ex.message.includes('Requested entity was not found')) {
      await admin.database()
      .ref(`Master/Users/${userId}/FCM`)
      .orderByValue()
      .equalTo(tokensForNoti)
      .once('value', snapshot => {
        snapshot.forEach(child => {
          child.ref.remove();
        });
      });
    console.error('Error sending message - specific condition:', ex);
  } else {
    console.error('Error sending message:', ex);
  }
  }
  }
 return responses; 
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**            v
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

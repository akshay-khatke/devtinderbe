import { messaging } from "../config/firebase.js";

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!messaging) {
    console.warn("Firebase Admin is not initialized. Notification will not be sent.");
    return false;
  }

  if (!fcmToken) {
    console.warn("No FCM token provided. Cannot send notification.");
    return false;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: fcmToken,
  };

  try {
    const response = await messaging.send(message);
    console.log("Successfully sent notification:", response);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

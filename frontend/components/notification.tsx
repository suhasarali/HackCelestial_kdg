// notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications behave when received while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ✅ Setup permissions & channel
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  try {
    // Android: create a channel with high importance + sound
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("alerts", {
        name: "Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default", // play default notification sound
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Get permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (err) {
    console.error("❌ Error registering for notifications:", err);
    return false;
  }
}

// ✅ Send local notification
export async function sendAlertNotification({
  title,
  body,
  sound,
}: {
  title: string;
  body: string;
  sound?: boolean | string;
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: sound ? (typeof sound === "string" ? sound : "default") : undefined,
      },
      trigger: null, // instant notification
    });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
  }
}

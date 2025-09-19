// notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Setup permissions once
export async function registerForPushNotificationsAsync() {
  let status;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  status = existingStatus;

  if (existingStatus !== 'granted') {
    const { status: askedStatus } = await Notifications.requestPermissionsAsync();
    status = askedStatus;
  }
  return status === 'granted';
}

// Trigger local notifications
export async function sendAlertNotification(alert: { type: string; message: string; priority: string }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: alert.type === 'weather' ? '🌦 Weather Alert' : '⚠️ Alert',
      body: alert.message,
      sound: true,
      priority: alert.priority === 'high'
        ? Notifications.AndroidNotificationPriority.HIGH
        : Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: null, // send immediately
  });
}

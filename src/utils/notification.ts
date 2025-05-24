import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';

export const requestNotificationPermission = async () => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
};

export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: 'travel',
    name: '여행 알림',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
};

export const showNotification = async (title: string, body: string) => {
  await createNotificationChannel();
  
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'travel',
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const scheduleNotification = async (title: string, body: string, date: Date) => {
  await createNotificationChannel();
  
  await notifee.createTriggerNotification(
    {
      title,
      body,
      android: {
        channelId: 'travel',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    },
    {
      type: 'timestamp',
      timestamp: date.getTime(),
    },
  );
}; 
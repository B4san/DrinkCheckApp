import * as Notifications from 'expo-notifications';

export class NotificationService {
  static async initialize(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configurar el manejador de notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  static async sendMovementAlert(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Alerta de Seguridad',
          body: 'Se ha detectado movimiento en tu dispositivo ESP32.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Mostrar inmediatamente
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendConnectionAlert(message: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Monitor ESP32',
          body: message,
          sound: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending connection notification:', error);
    }
  }
}
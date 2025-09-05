import PushNotification from 'react-native-push-notification';

export class NotificationService {
  static async initialize(): Promise<boolean> {
    try {
      // Configure push notifications
      PushNotification.configure({
        onNotification: function(notification) {
          console.log('NOTIFICATION:', notification);
        },
        requestPermissions: true,
      });

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  static async sendMovementAlert(): Promise<void> {
    try {
      PushNotification.localNotification({
        title: 'Alerta de Seguridad',
        message: 'Se ha detectado movimiento en tu dispositivo ESP32.',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendConnectionAlert(message: string): Promise<void> {
    try {
      PushNotification.localNotification({
        title: 'Monitor ESP32',
        message: message,
        playSound: false,
      });
    } catch (error) {
      console.error('Error sending connection notification:', error);
    }
  }
}
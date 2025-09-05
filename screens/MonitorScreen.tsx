import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import { Thermometer, Droplets, Activity, Wifi, WifiOff, Send, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

interface SensorData {
  temperature: number;
  humidity: number;
  movement_alert: boolean;
  timestamp: string;
}

interface DataReading {
  id: string;
  temperature: number;
  humidity: number;
  movement_alert: boolean;
  timestamp: string;
  date: string;
}

export default function MonitorScreen() {
  const [ipAddress, setIpAddress] = useState('192.168.1.108');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    movement_alert: false,
    timestamp: '',
  });
  const [connectionError, setConnectionError] = useState('');
  const [isSendingData, setIsSendingData] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    configureNotifications();
    requestNotificationPermissions();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const configureNotifications = () => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    PushNotification.createChannel(
      {
        channelId: 'movement-alerts',
        channelName: 'Movement Alerts',
        channelDescription: 'Notifications for movement detection',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  };

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs access to show notifications for movement alerts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Notification permissions are required for movement alerts.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const fetchSensorData = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${ipAddress}/data`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const newSensorData: SensorData = {
        temperature: parseFloat(data.temperature) || 0,
        humidity: parseFloat(data.humidity) || 0,
        movement_alert: Boolean(data.movement_alert),
        timestamp: new Date().toLocaleTimeString(),
      };

      setSensorData(newSensorData);
      setConnectionError('');
      setLastUpdate(new Date());
      
      // Guardar datos en AsyncStorage
      await saveDataReading(newSensorData);
      
      // Verificar alerta de movimiento
      if (newSensorData.movement_alert && !sensorData.movement_alert) {
        await handleMovementAlert();
      }
      
      return true;
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      setConnectionError(`Error de conexión: ${error.message}`);
      return false;
    }
  };

  const saveDataReading = async (data: SensorData) => {
    try {
      const reading: DataReading = {
        id: Date.now().toString(),
        ...data,
        date: new Date().toLocaleDateString(),
      };

      const existingData = await AsyncStorage.getItem('sensorHistory');
      let history: DataReading[] = existingData ? JSON.parse(existingData) : [];
      
      history.unshift(reading);
      history = history.slice(0, 10); // Mantener solo las últimas 10 lecturas
      
      await AsyncStorage.setItem('sensorHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleMovementAlert = async () => {
    // Enviar notificación
    PushNotification.localNotification({
      channelId: 'movement-alerts',
      title: 'Alerta de Seguridad',
      message: 'Se ha detectado movimiento en tu dispositivo ESP32.',
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });

    // Resetear alerta en ESP32
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch(`http://${ipAddress}/reset_alert`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error resetting alert:', error);
    }
  };

  const toggleConnection = async () => {
    if (isConnected) {
      // Desconectar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
      setConnectionError('');
    } else {
      // Conectar
      if (!validateIP(ipAddress)) {
        Alert.alert('IP Inválida', 'Por favor ingresa una dirección IP válida.');
        return;
      }

      setIsConnecting(true);
      const success = await fetchSensorData();
      
      if (success) {
        setIsConnected(true);
        intervalRef.current = setInterval(fetchSensorData, 5000);
      } else {
        Alert.alert('Error de Conexión', 'No se pudo conectar al ESP32. Verifica la IP y que el dispositivo esté encendido.');
      }
      
      setIsConnecting(false);
    }
  };

  const sendDataToCloud = async () => {
    setIsSendingData(true);
    setWebhookResponse('');

    try {
      const historyData = await AsyncStorage.getItem('sensorHistory');
      const readings: DataReading[] = historyData ? JSON.parse(historyData) : [];

      if (readings.length === 0) {
        Alert.alert('Sin Datos', 'No hay datos para enviar.');
        setIsSendingData(false);
        return;
      }

      const response = await fetch('https://hook.us2.make.com/jz9d621l3omczycgisjqkrxl22vhch9g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: `ESP32_${ipAddress.replace(/\./g, '_')}`,
          readings: readings,
          total_readings: readings.length,
          timestamp: new Date().toISOString(),
        }),
      });

      const responseText = await response.text();
      setWebhookResponse(`Respuesta (${response.status}): ${responseText}`);
      
      if (response.ok) {
        Alert.alert('Éxito', 'Datos enviados correctamente a la nube.');
      } else {
        Alert.alert('Error', 'Error al enviar datos. Revisa la respuesta del servidor.');
      }
    } catch (error: any) {
      console.error('Error sending data:', error);
      setWebhookResponse(`Error: ${error.message}`);
      Alert.alert('Error', 'Error al enviar datos a la nube.');
    }

    setIsSendingData(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Monitor ESP32</Text>
        <Text style={styles.subtitle}>Control de Sensores en Tiempo Real</Text>
      </View>

      {/* Configuración de Conexión */}
      <View style={styles.connectionCard}>
        <Text style={styles.cardTitle}>Configuración de Conexión</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dirección IP del ESP32:</Text>
          <TextInput
            style={styles.input}
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="192.168.1.108"
            editable={!isConnected}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.connectionButton,
            isConnected ? styles.connectedButton : styles.disconnectedButton
          ]}
          onPress={toggleConnection}
          disabled={isConnecting}
        >
          <View style={styles.buttonContent}>
            {isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                {isConnected ? <Wifi size={20} color="#FFFFFF" /> : <WifiOff size={20} color="#FFFFFF" />}
                <Text style={styles.buttonText}>
                  {isConnected ? 'Desconectar' : 'Conectar'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {connectionError ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        ) : null}

        {isConnected && lastUpdate && (
          <View style={styles.statusContainer}>
            <CheckCircle size={16} color="#059669" />
            <Text style={styles.statusText}>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {/* Datos de Sensores */}
      <View style={styles.sensorsContainer}>
        <Text style={styles.cardTitle}>Datos en Tiempo Real</Text>
        
        <View style={styles.sensorsGrid}>
          {/* Temperatura */}
          <View style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <Thermometer size={24} color="#DC2626" />
              <Text style={styles.sensorLabel}>Temperatura</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.temperature.toFixed(1)} °C</Text>
            <Text style={styles.sensorTime}>{sensorData.timestamp}</Text>
          </View>

          {/* Humedad */}
          <View style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <Droplets size={24} color="#2563EB" />
              <Text style={styles.sensorLabel}>Humedad</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.humidity.toFixed(1)} %</Text>
            <Text style={styles.sensorTime}>{sensorData.timestamp}</Text>
          </View>
        </View>

        {/* Alerta de Movimiento */}
        <View style={[
          styles.alertCard,
          sensorData.movement_alert ? styles.alertActive : styles.alertInactive
        ]}>
          <View style={styles.alertHeader}>
            <Activity size={24} color={sensorData.movement_alert ? "#FFFFFF" : "#6B7280"} />
            <Text style={[
              styles.alertLabel,
              sensorData.movement_alert ? styles.alertLabelActive : styles.alertLabelInactive
            ]}>
              Sensor de Movimiento
            </Text>
          </View>
          <Text style={[
            styles.alertStatus,
            sensorData.movement_alert ? styles.alertStatusActive : styles.alertStatusInactive
          ]}>
            {sensorData.movement_alert ? '¡MOVIMIENTO DETECTADO!' : 'Estable'}
          </Text>
        </View>
      </View>

      {/* Envío a la Nube */}
      <View style={styles.cloudCard}>
        <Text style={styles.cardTitle}>Envío de Datos</Text>
        
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendDataToCloud}
          disabled={isSendingData}
        >
          <View style={styles.buttonContent}>
            {isSendingData ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Enviar Datos a la Nube</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {webhookResponse ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Respuesta del Servidor:</Text>
            <Text style={styles.responseText}>{webhookResponse}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  connectionButton: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  connectedButton: {
    backgroundColor: '#059669',
  },
  disconnectedButton: {
    backgroundColor: '#2563EB',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusText: {
    color: '#059669',
    fontSize: 14,
  },
  sensorsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sensorsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sensorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sensorTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
  },
  alertActive: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  alertInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertLabelActive: {
    color: '#FFFFFF',
  },
  alertLabelInactive: {
    color: '#374151',
  },
  alertStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertStatusActive: {
    color: '#FFFFFF',
  },
  alertStatusInactive: {
    color: '#6B7280',
  },
  cloudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  responseContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
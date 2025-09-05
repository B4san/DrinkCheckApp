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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Thermometer, Droplets, Activity, Wifi, WifiOff, Send, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { 
  neumorphicColors, 
  createNeumorphicStyle, 
  createNeumorphicButtonStyle, 
  neumorphicTextStyles,
  neumorphicStyles 
} from '../../styles/neumorphic';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  
  // States for neumorphic button press effects
  const [isConnectionButtonPressed, setIsConnectionButtonPressed] = useState(false);
  const [isSendButtonPressed, setIsSendButtonPressed] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestNotificationPermissions();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesitan permisos de notificación para las alertas de movimiento.');
    }
  };

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const fetchSensorData = async (): Promise<boolean> => {
    try {
      const response = await fetch(`http://${ipAddress}/data`, {
        timeout: 5000,
      });
      
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
    } catch (error) {
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alerta de Seguridad',
        body: 'Se ha detectado movimiento en tu dispositivo ESP32.',
        sound: true,
      },
      trigger: null,
    });

    // Resetear alerta en ESP32
    try {
      await fetch(`http://${ipAddress}/reset_alert`, {
        method: 'POST',
        timeout: 3000,
      });
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
    } catch (error) {
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
            placeholderTextColor={neumorphicColors.textTertiary}
            editable={!isConnected}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[
            isConnected 
              ? createNeumorphicButtonStyle({ 
                  variant: 'success', 
                  pressed: isConnectionButtonPressed 
                })
              : createNeumorphicButtonStyle({ 
                  variant: 'primary', 
                  pressed: isConnectionButtonPressed 
                })
          ]}
          onPress={toggleConnection}
          onPressIn={() => setIsConnectionButtonPressed(true)}
          onPressOut={() => setIsConnectionButtonPressed(false)}
          disabled={isConnecting}
        >
          <View style={styles.buttonContent}>
            {isConnecting ? (
              <ActivityIndicator size="small" color={neumorphicColors.textPrimary} />
            ) : (
              <>
                {isConnected ? 
                  <Wifi size={20} color={neumorphicColors.textPrimary} /> : 
                  <WifiOff size={20} color={neumorphicColors.textPrimary} />
                }
                <Text style={styles.buttonText}>
                  {isConnected ? 'Desconectar' : 'Conectar'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {connectionError ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={16} color={neumorphicColors.textPrimary} />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        ) : null}

        {isConnected && lastUpdate && (
          <View style={styles.statusContainer}>
            <CheckCircle size={16} color={neumorphicColors.textPrimary} />
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
              <Thermometer size={24} color={neumorphicColors.textSecondary} />
              <Text style={styles.sensorLabel}>Temperatura</Text>
            </View>
            <Text style={styles.sensorValue}>{sensorData.temperature.toFixed(1)} °C</Text>
            <Text style={styles.sensorTime}>{sensorData.timestamp}</Text>
          </View>

          {/* Humedad */}
          <View style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <Droplets size={24} color={neumorphicColors.textSecondary} />
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
            <Activity size={24} color={neumorphicColors.textPrimary} />
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
          style={createNeumorphicButtonStyle({ 
            variant: 'primary', 
            size: 'large',
            pressed: isSendButtonPressed 
          })}
          onPress={sendDataToCloud}
          onPressIn={() => setIsSendButtonPressed(true)}
          onPressOut={() => setIsSendButtonPressed(false)}
          disabled={isSendingData}
        >
          <View style={styles.buttonContent}>
            {isSendingData ? (
              <ActivityIndicator size="small" color={neumorphicColors.textPrimary} />
            ) : (
              <>
                <Send size={20} color={neumorphicColors.textPrimary} />
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
  container: neumorphicStyles.container,
  contentContainer: neumorphicStyles.contentContainer,
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: neumorphicTextStyles.title,
  subtitle: neumorphicTextStyles.subtitle,
  connectionCard: {
    ...createNeumorphicStyle({ size: 'large' }),
    marginBottom: 20,
  },
  cardTitle: neumorphicTextStyles.cardTitle,
  inputContainer: {
    marginBottom: 16,
  },
  label: neumorphicTextStyles.label,
  input: {
    ...neumorphicStyles.input,
    // Inset shadow effect for input
    shadowColor: neumorphicColors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
  },
  connectionButton: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: neumorphicTextStyles.buttonText,
  errorContainer: {
    ...createNeumorphicStyle({ size: 'small', borderRadius: 8 }),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: neumorphicColors.alert,
  },
  errorText: {
    color: neumorphicColors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  statusContainer: {
    ...createNeumorphicStyle({ size: 'small', borderRadius: 8 }),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: neumorphicColors.success,
  },
  statusText: {
    color: neumorphicColors.textPrimary,
    fontSize: 14,
  },
  sensorsContainer: {
    ...createNeumorphicStyle({ size: 'large' }),
    marginBottom: 20,
  },
  sensorsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sensorCard: {
    flex: 1,
    ...createNeumorphicStyle({ size: 'medium', borderRadius: 8 }),
    backgroundColor: neumorphicColors.surface,
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
    color: neumorphicColors.textPrimary,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: '700',
    color: neumorphicColors.textPrimary,
    marginBottom: 4,
  },
  sensorTime: {
    fontSize: 12,
    color: neumorphicColors.textTertiary,
  },
  alertCard: {
    borderRadius: 8,
    padding: 16,
    ...createNeumorphicStyle({ size: 'medium', borderRadius: 8 }),
  },
  alertActive: {
    backgroundColor: neumorphicColors.alert,
    shadowColor: neumorphicColors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  alertInactive: {
    backgroundColor: neumorphicColors.surface,
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
    color: neumorphicColors.textPrimary,
  },
  alertLabelInactive: {
    color: neumorphicColors.textPrimary,
  },
  alertStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertStatusActive: {
    color: neumorphicColors.textPrimary,
  },
  alertStatusInactive: {
    color: neumorphicColors.textSecondary,
  },
  cloudCard: {
    ...createNeumorphicStyle({ size: 'large' }),
  },
  responseContainer: {
    ...createNeumorphicStyle({ size: 'small', borderRadius: 8 }),
    backgroundColor: neumorphicColors.surface,
    // Inset shadow for response container
    shadowColor: neumorphicColors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.textPrimary,
    marginBottom: 8,
  },
  responseText: {
    fontSize: 12,
    color: neumorphicColors.textTertiary,
    fontFamily: 'monospace',
  },
});
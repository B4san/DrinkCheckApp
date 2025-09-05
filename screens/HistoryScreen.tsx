import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Thermometer, Droplets, Activity, Trash2, RefreshCw } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { 
  neumorphicColors, 
  createNeumorphicStyle, 
  createNeumorphicButtonStyle, 
  neumorphicTextStyles,
  neumorphicStyles 
} from '../styles/neumorphic';

interface DataReading {
  id: string;
  temperature: number;
  humidity: number;
  movement_alert: boolean;
  timestamp: string;
  date: string;
}

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState<DataReading[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // States for neumorphic button press effects
  const [isRefreshButtonPressed, setIsRefreshButtonPressed] = useState(false);
  const [isClearButtonPressed, setIsClearButtonPressed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
    }, [])
  );

  const loadHistoryData = async () => {
    try {
      const data = await AsyncStorage.getItem('sensorHistory');
      if (data) {
        const parsedData: DataReading[] = JSON.parse(data);
        setHistoryData(parsedData);
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  };

  const clearHistory = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar todo el historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('sensorHistory');
              setHistoryData([]);
              Alert.alert('Éxito', 'Historial eliminado correctamente.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el historial.');
            }
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: DataReading }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{item.date}</Text>
        <Text style={styles.itemTime}>{item.timestamp}</Text>
      </View>
      
      <View style={styles.itemData}>
        <View style={styles.dataItem}>
          <Thermometer size={16} color={neumorphicColors.textSecondary} />
          <Text style={styles.dataValue}>{item.temperature.toFixed(1)}°C</Text>
        </View>
        
        <View style={styles.dataItem}>
          <Droplets size={16} color={neumorphicColors.textSecondary} />
          <Text style={styles.dataValue}>{item.humidity.toFixed(1)}%</Text>
        </View>
        
        <View style={styles.dataItem}>
          <Activity size={16} color={item.movement_alert ? neumorphicColors.alert : neumorphicColors.textTertiary} />
          <Text style={[
            styles.dataValue,
            item.movement_alert ? styles.alertActive : styles.alertInactive
          ]}>
            {item.movement_alert ? 'Movimiento' : 'Estable'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Activity size={48} color={neumorphicColors.textTertiary} />
      <Text style={styles.emptyTitle}>Sin Datos</Text>
      <Text style={styles.emptySubtitle}>
        No hay lecturas guardadas aún. Conéctate a tu ESP32 para comenzar a recopilar datos.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Sensores</Text>
        <Text style={styles.subtitle}>Últimas {historyData.length} lecturas guardadas</Text>
      </View>

      {historyData.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={createNeumorphicButtonStyle({ 
              variant: 'secondary', 
              size: 'small',
              pressed: isRefreshButtonPressed 
            })}
            onPress={onRefresh}
            onPressIn={() => setIsRefreshButtonPressed(true)}
            onPressOut={() => setIsRefreshButtonPressed(false)}
          >
            <View style={styles.buttonContent}>
              <RefreshCw size={16} color={neumorphicColors.textPrimary} />
              <Text style={styles.buttonText}>Actualizar</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={createNeumorphicButtonStyle({ 
              variant: 'alert', 
              size: 'small',
              pressed: isClearButtonPressed 
            })}
            onPress={clearHistory}
            onPressIn={() => setIsClearButtonPressed(true)}
            onPressOut={() => setIsClearButtonPressed(false)}
          >
            <View style={styles.buttonContent}>
              <Trash2 size={16} color={neumorphicColors.textPrimary} />
              <Text style={styles.buttonText}>Limpiar Historial</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={historyData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={neumorphicColors.textSecondary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={historyData.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: neumorphicStyles.container,
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: neumorphicTextStyles.title,
  subtitle: {
    fontSize: 14,
    color: neumorphicColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.textPrimary,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: neumorphicColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: neumorphicColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyItem: {
    ...createNeumorphicStyle({ size: 'medium' }),
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: neumorphicColors.shadowDark,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.textPrimary,
  },
  itemTime: {
    fontSize: 14,
    color: neumorphicColors.textSecondary,
  },
  itemData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dataItem: {
    alignItems: 'center',
    gap: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: neumorphicColors.textPrimary,
  },
  alertActive: {
    color: neumorphicColors.alert,
  },
  alertInactive: {
    color: neumorphicColors.textTertiary,
  },
});
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
          <Thermometer size={16} color="#DC2626" />
          <Text style={styles.dataValue}>{item.temperature.toFixed(1)}°C</Text>
        </View>
        
        <View style={styles.dataItem}>
          <Droplets size={16} color="#2563EB" />
          <Text style={styles.dataValue}>{item.humidity.toFixed(1)}%</Text>
        </View>
        
        <View style={styles.dataItem}>
          <Activity size={16} color={item.movement_alert ? "#DC2626" : "#6B7280"} />
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
      <Activity size={48} color="#9CA3AF" />
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
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <RefreshCw size={16} color="#2563EB" />
            <Text style={styles.refreshText}>Actualizar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={styles.clearText}>Limpiar Historial</Text>
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
            tintColor="#2563EB"
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  refreshText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  itemTime: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#1E293B',
  },
  alertActive: {
    color: '#DC2626',
  },
  alertInactive: {
    color: '#6B7280',
  },
});
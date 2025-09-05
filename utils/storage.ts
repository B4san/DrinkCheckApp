import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DataReading {
  id: string;
  temperature: number;
  humidity: number;
  movement_alert: boolean;
  timestamp: string;
  date: string;
}

const STORAGE_KEYS = {
  SENSOR_HISTORY: 'sensorHistory',
  SETTINGS: 'appSettings',
};

export class StorageService {
  static async saveReading(data: Omit<DataReading, 'id' | 'date'>): Promise<void> {
    try {
      const reading: DataReading = {
        id: Date.now().toString(),
        ...data,
        date: new Date().toLocaleDateString(),
      };

      const existingData = await this.getHistory();
      const updatedHistory = [reading, ...existingData].slice(0, 10);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SENSOR_HISTORY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  }

  static async getHistory(): Promise<DataReading[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SENSOR_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SENSOR_HISTORY);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  static async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }
}
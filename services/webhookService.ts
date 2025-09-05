import { DataReading } from '../utils/storage';

export interface WebhookPayload {
  device_id: string;
  readings: DataReading[];
  total_readings: number;
  timestamp: string;
}

export interface WebhookResponse {
  success: boolean;
  status: number;
  message: string;
  data?: any;
}

export class WebhookService {
  private static readonly WEBHOOK_URL = 'https://hook.us2.make.com/jz9d621l3omczycgisjqkrxl22vhch9g';
  private static readonly REQUEST_TIMEOUT = 10000;

  static async sendData(readings: DataReading[], deviceIP: string): Promise<WebhookResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    const payload: WebhookPayload = {
      device_id: `ESP32_${deviceIP.replace(/\./g, '_')}`,
      readings: readings,
      total_readings: readings.length,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Datos enviados correctamente' : `Error ${response.status}`,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout al enviar datos al servidor');
      }
      
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }
}
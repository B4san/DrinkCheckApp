# DrinkCheckApp

Una aplicación React Native pura para monitorear sensores ESP32 en tiempo real.

## Características

- 📊 Monitoreo en tiempo real de temperatura, humedad y movimiento desde ESP32
- 🔔 Notificaciones push para alertas de movimiento
- 📱 Interfaz nativa para Android e iOS
- 💾 Almacenamiento local de historial de lecturas
- ☁️ Envío de datos a la nube mediante webhook
- 🔄 Navegación por pestañas entre Monitor e Historial

## Tecnologías

- **React Native 0.73.6** - Framework principal
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local
- **react-native-push-notification** - Notificaciones push
- **TypeScript** - Tipado estático
- **ESLint** - Linting de código

## Instalación

### Prerrequisitos

1. Node.js >= 18
2. React Native CLI: `npm install -g react-native-cli`
3. Android Studio (para Android)
4. Xcode (para iOS, solo en macOS)

### Configuración del entorno

Sigue la [guía oficial de React Native](https://reactnative.dev/docs/environment-setup) para configurar tu entorno de desarrollo.

### Instalación de dependencias

```bash
npm install
```

### Configuración Android

Para notificaciones push en Android, asegúrate de que los permisos estén configurados correctamente en `android/app/src/main/AndroidManifest.xml`.

## Ejecución

### Desarrollo

```bash
# Iniciar Metro bundler
npm start

# En otra terminal, ejecutar en Android
npm run android

# O ejecutar en iOS (solo macOS)
npm run ios
```

### Comandos disponibles

```bash
npm start          # Iniciar Metro bundler
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run lint       # Ejecutar linting
```

## Configuración ESP32

La aplicación se conecta a un dispositivo ESP32 que debe exponer los siguientes endpoints:

- `GET /data` - Retorna datos de sensores en formato JSON:
  ```json
  {
    "temperature": 25.5,
    "humidity": 60.2,
    "movement_alert": false
  }
  ```

- `POST /reset_alert` - Resetea la alerta de movimiento

## Estructura del proyecto

```
├── App.tsx                    # Componente principal con navegación
├── screens/
│   ├── MonitorScreen.tsx      # Pantalla de monitoreo en tiempo real
│   └── HistoryScreen.tsx      # Pantalla de historial de lecturas
├── index.js                   # Punto de entrada de la aplicación
├── package.json               # Dependencias y scripts
├── tsconfig.json             # Configuración TypeScript
├── metro.config.js           # Configuración Metro bundler
├── babel.config.js           # Configuración Babel
└── .eslintrc.js              # Configuración ESLint
```

## Migración desde Expo

Esta aplicación fue migrada desde Expo a React Native puro. Los cambios principales incluyen:

- ✅ Reemplazado `expo-router` con `@react-navigation/native`
- ✅ Reemplazado `expo-notifications` con `react-native-push-notification`
- ✅ Reemplazado `expo-status-bar` con React Native `StatusBar`
- ✅ Convertida estructura de archivos de Expo a React Native estándar
- ✅ Configuración Metro y Babel para React Native
- ✅ Actualizado TypeScript para React Native

## Funcionalidades

### Monitor de Sensores
- Conexión a ESP32 por IP
- Lecturas automáticas cada 5 segundos
- Visualización de temperatura, humedad y alertas de movimiento
- Notificaciones push para alertas de movimiento

### Historial
- Almacenamiento local de las últimas 10 lecturas
- Visualización histórica de todos los parámetros
- Opción de limpiar historial

### Envío a la Nube
- Integración con webhook para envío de datos
- Respuesta del servidor mostrada en la interfaz

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

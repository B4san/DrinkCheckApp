import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity, History } from 'lucide-react-native';
import { neumorphicColors } from './styles/neumorphic';

// Import screens
import MonitorScreen from './screens/MonitorScreen';
import HistoryScreen from './screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={neumorphicColors.background} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: neumorphicColors.textPrimary,
          tabBarInactiveTintColor: neumorphicColors.textTertiary,
          tabBarStyle: {
            backgroundColor: neumorphicColors.background,
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 8,
            height: 80,
            shadowColor: neumorphicColors.shadowDark,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          },
        }}>
        <Tab.Screen
          name="Monitor"
          component={MonitorScreen}
          options={{
            title: 'Monitor',
            tabBarIcon: ({ size, color }) => (
              <Activity size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Historial',
            tabBarIcon: ({ size, color }) => (
              <History size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
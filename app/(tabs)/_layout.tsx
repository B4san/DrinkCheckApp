import { Tabs } from 'expo-router';
import { Activity, History, Settings } from 'lucide-react-native';
import { neumorphicColors } from '../../styles/neumorphic';

export default function TabLayout() {
  return (
    <Tabs
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
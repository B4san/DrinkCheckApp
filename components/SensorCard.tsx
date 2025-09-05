import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { neumorphicColors, createNeumorphicStyle, neumorphicTextStyles } from '../styles/neumorphic';

interface SensorCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export default function SensorCard({ title, value, unit, icon, color }: SensorCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: neumorphicColors.textPrimary }]}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...createNeumorphicStyle({ size: 'medium', borderRadius: 12 }),
    alignItems: 'center',
    minWidth: 120,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.textPrimary,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
    color: neumorphicColors.textPrimary,
  },
  unit: {
    fontSize: 12,
    color: neumorphicColors.textTertiary,
    fontWeight: '500',
  },
});
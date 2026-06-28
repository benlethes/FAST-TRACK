import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

function TimerIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AnalyticsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3"  y="13" width="3.5" height="8"  rx="1" fill={color} />
      <Rect x="10" y="8"  width="3.5" height="13" rx="1" fill={color} />
      <Rect x="17" y="4"  width="3.5" height="17" rx="1" fill={color} />
    </Svg>
  );
}

function WeightIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17h18l-2-9H5L3 17z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9 8a3 3 0 0 1 6 0" stroke={color} strokeWidth={1.6} />
      <Line x1="12" y1="12" x2="12" y2="14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color} strokeWidth={1.6} strokeLinecap="round"
      />
    </Svg>
  );
}

const LABELS: Record<string, string> = {
  index:     'Timer',
  analytics: 'Analytics',
  weight:    'Weight',
  settings:  'Settings',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.red,
        tabBarInactiveTintColor: '#BBBBBB',
        tabBarIcon: ({ color }) => {
          if (route.name === 'index')     return <TimerIcon    color={color} />;
          if (route.name === 'analytics') return <AnalyticsIcon color={color} />;
          if (route.name === 'weight')    return <WeightIcon    color={color} />;
          if (route.name === 'settings')  return <SettingsIcon  color={color} />;
          return null;
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={[label.text, { color }]}>
            {LABELS[route.name] ?? route.name}
          </Text>
        ),
        tabBarItemStyle: { paddingTop: 2 },
      })}
    >
      <Tabs.Screen name="index"     options={{ title: 'Timer' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="weight"    options={{ title: 'Weight' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const label = StyleSheet.create({
  text: {
    fontSize: 10,
    fontFamily: FONT,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});

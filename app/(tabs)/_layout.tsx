import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── Labels ───────────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  index:     'Timer',
  analytics: 'Analytics',
  weight:    'Weight',
  settings:  'Settings',
};

// ─── Floating pill tab bar ─────────────────────────────────────────────────────

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? Colors.red : '#BBBBBB';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              activeOpacity={0.65}
            >
              {/* Active indicator line above icon */}
              <View style={[styles.activeLine, isFocused && styles.activeLineVisible]} />

              {route.name === 'index'     && <TimerIcon    color={color} />}
              {route.name === 'analytics' && <AnalyticsIcon color={color} />}
              {route.name === 'weight'    && <WeightIcon    color={color} />}
              {route.name === 'settings'  && <SettingsIcon  color={color} />}

              <Text style={[styles.label, { color }]}>
                {LABELS[route.name] ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index"     options={{ title: 'Timer' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="weight"    options={{ title: 'Weight' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper — blends with screen background so the pill appears to float
  outer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // The floating pill
  pill: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 66,
    alignItems: 'stretch',
    // iOS shadow
    shadowColor: '#1A1400',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 18,
    // Android shadow
    elevation: 10,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },

  // Thin red line that appears at the top of the pill for the active tab
  activeLine: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  activeLineVisible: {
    backgroundColor: Colors.red,
  },

  label: {
    fontSize: 10,
    fontFamily: FONT,
    letterSpacing: 0.3,
    marginTop: 4,
  },
});

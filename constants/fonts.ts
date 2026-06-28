import { Platform } from 'react-native';

export const FONT = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif',
}) ?? 'System';

export const FONT_MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
}) ?? 'monospace';

import React, { useState, useEffect, createElement } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

// "2026-06-28T14:30" — value format for <input type="datetime-local">
function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Props {
  visible: boolean;
  title: string;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  confirmLabel?: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export function DatePickerModal({
  visible, title, value, minimumDate, maximumDate,
  confirmLabel = 'Confirm', onConfirm, onCancel,
}: Props) {
  const [current, setCurrent] = useState(value);

  // Reset to the incoming value each time the sheet opens
  useEffect(() => {
    if (visible) setCurrent(value);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web'
          // Web: native HTML datetime-local input
          ? createElement('input', {
              type: 'datetime-local',
              value: toDatetimeLocal(current),
              min: minimumDate ? toDatetimeLocal(minimumDate) : undefined,
              max: maximumDate ? toDatetimeLocal(maximumDate) : undefined,
              onChange: (e: any) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setCurrent(d);
              },
              style: {
                fontSize: 16,
                padding: 14,
                border: `1px solid ${Colors.border}`,
                borderRadius: 12,
                backgroundColor: Colors.background,
                color: Colors.textPrimary,
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: 16,
                fontFamily: 'inherit',
              },
            } as any)
          // iOS / Android: native drum-roll spinner
          : <DateTimePicker
              value={current}
              mode="datetime"
              display="spinner"
              onChange={(_e, d) => { if (d) setCurrent(d); }}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant="light"
              textColor={Colors.textPrimary}
              style={styles.picker}
              locale="en_GB"
            />
        }

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirm(current)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>

        <SafeAreaView />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  picker: {
    height: 200,
    marginHorizontal: -10,
  },
  confirmBtn: {
    backgroundColor: Colors.green,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT,
  },
});

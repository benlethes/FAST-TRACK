import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { useWeightContext } from '@/context/WeightContext';

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function intRange(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

const KG_INTS = intRange(30, 220);
const DECS    = [0, 5];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WeightModal({ visible, onClose }: Props) {
  const { records, logWeight } = useWeightContext();

  const [weightInt, setWeightInt] = useState(70);
  const [weightDec, setWeightDec] = useState(0);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    if (!visible) return;
    setDateTime(new Date());
    const lastKg = records[0]?.weightKg ?? 70;
    const clamped = Math.min(Math.max(Math.round(lastKg), KG_INTS[0]), KG_INTS[KG_INTS.length - 1]);
    setWeightInt(clamped);
    setWeightDec(0);
  }, [visible, records]);

  const handleSave = async () => {
    const weightKg = weightInt + weightDec / 10;
    await logWeight(Math.round(weightKg * 100) / 100, localDate(dateTime), localTime(dateTime));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Weight</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Weight pickers */}
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={weightInt}
            onValueChange={v => setWeightInt(Number(v))}
            style={styles.pickerInt}
            itemStyle={styles.pickerItem}
          >
            {KG_INTS.map(n => (
              <Picker.Item key={n} label={String(n)} value={n} />
            ))}
          </Picker>

          <View style={styles.pickerDot}>
            <Text style={styles.dotText}>.</Text>
          </View>

          <Picker
            selectedValue={weightDec}
            onValueChange={v => setWeightDec(Number(v))}
            style={styles.pickerDec}
            itemStyle={styles.pickerItem}
          >
            {DECS.map(d => (
              <Picker.Item key={d} label={String(d)} value={d} />
            ))}
          </Picker>

          <View style={styles.pickerUnit}>
            <Text style={styles.unitLabel}>kg</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Date & time */}
        <Text style={styles.sectionLabel}>Date &amp; Time</Text>
        <DateTimePicker
          value={dateTime}
          mode="datetime"
          display="spinner"
          onChange={(_e, d) => { if (d) setDateTime(d); }}
          maximumDate={new Date()}
          themeVariant="light"
          textColor={Colors.textPrimary}
          style={styles.datePicker}
          locale="en_GB"
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Weight</Text>
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
    backgroundColor: '#FFFFFF',
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
  closeBtn: {
    fontSize: 16,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
  },
  pickerInt: {
    flex: 3,
  },
  pickerDec: {
    flex: 2,
  },
  pickerItem: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  pickerDot: {
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  dotText: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontFamily: FONT,
    lineHeight: 28,
  },
  pickerUnit: {
    justifyContent: 'center',
    paddingLeft: 4,
    width: 36,
  },
  unitLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: FONT,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 0,
  },
  datePicker: {
    height: 180,
    marginHorizontal: -10,
  },
  saveBtn: {
    backgroundColor: Colors.red,
    borderRadius: 3,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.20 * 11,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },
});

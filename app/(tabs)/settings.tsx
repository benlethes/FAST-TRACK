import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet,
  SafeAreaView, Alert, Modal,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { Wordmark } from '@/components/Wordmark';
import { useFastingContext } from '@/context/FastingContext';
import { useSettings, WeekStart, TimeFormat } from '@/context/SettingsContext';
import { FastRecord } from '@/constants/mockData';

// ─── Small picker modal ───────────────────────────────────────────────────────

function PickerModal<T extends string>({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pm.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={pm.sheet}>
        <Text style={pm.title}>{title}</Text>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[pm.option, o.value === selected && pm.optionSelected]}
            onPress={() => { onSelect(o.value); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={[pm.optionText, o.value === selected && pm.optionTextSelected]}>
              {o.label}
            </Text>
            {o.value === selected && <Text style={pm.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 4,
  },
  title: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: FONT,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optionSelected: {},
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  optionTextSelected: { fontWeight: '600' },
  check: { fontSize: 16, color: Colors.red },
});

// ─── Goal stepper modal ───────────────────────────────────────────────────────

function GoalModal({
  visible, value, onConfirm, onClose,
}: { visible: boolean; value: number; onConfirm: (v: number) => void; onClose: () => void }) {
  const [goal, setGoal] = useState(value);
  const SNAP = [12, 14, 16, 18, 20, 22, 24];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pm.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[pm.sheet, { gap: 16 }]}>
        <Text style={pm.title}>Default fasting goal</Text>
        <Text style={{ fontSize: 48, fontWeight: '200', color: Colors.textPrimary, fontFamily: FONT, textAlign: 'center' }}>
          {goal}h
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {SNAP.map(h => (
            <TouchableOpacity
              key={h}
              onPress={() => setGoal(h)}
              style={{
                paddingHorizontal: 18, paddingVertical: 8, borderRadius: 3,
                backgroundColor: h === goal ? Colors.red : Colors.card,
                borderWidth: 1, borderColor: h === goal ? Colors.red : Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: h === goal ? '#fff' : Colors.textPrimary, fontFamily: FONT }}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={{ backgroundColor: Colors.red, borderRadius: 3, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
          onPress={() => { onConfirm(goal); onClose(); }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontSize: 11, letterSpacing: 0.20 * 11, textTransform: 'uppercase', fontFamily: FONT }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function TapRow({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1} disabled={!onPress}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D5D1C8', true: Colors.green }}
        thumbColor="#fff"
        ios_backgroundColor="#D5D1C8"
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { fasts, importFasts, resetToMockData, clearAllData } = useFastingContext();
  const { weekStart, timeFormat, defaultGoal, setWeekStart, setTimeFormat, setDefaultGoal } = useSettings();

  const [reminderAtGoal, setReminderAtGoal] = useState(true);
  const [startReminder,  setStartReminder]  = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGoalModal,  setShowGoalModal]  = useState(false);

  const handleExport = async () => {
    try {
      const today   = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const path    = `${FileSystem.cacheDirectory}fasttrack-backup-${dateStr}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(fasts, null, 2));
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save your FAST//TRACK backup',
        UTI: 'public.json',
      });
    } catch {
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed: unknown = JSON.parse(content);
      if (!Array.isArray(parsed)) { Alert.alert('Invalid file', 'Not a valid FAST//TRACK backup.'); return; }
      const valid = (parsed as FastRecord[]).filter(
        f => typeof f.date === 'string' && typeof f.durationHours === 'number' && typeof f.goalHit === 'boolean'
      );
      if (valid.length === 0) { Alert.alert('No valid records', 'No recognisable fast records found.'); return; }
      Alert.alert('Import backup', `Found ${valid.length} fasts. This will replace your current data.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Import ${valid.length} fasts`, onPress: () => importFasts(valid) },
      ]);
    } catch {
      Alert.alert('Import failed', 'Could not read that file.');
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Data', 'Choose an option:', [
      { text: 'Restore demo data', onPress: resetToMockData },
      {
        text: 'Clear everything',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Clear all data?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearAllData },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Wordmark />
          <Text style={styles.screenLabel}>Settings</Text>
        </View>

        {/* Fasting */}
        <View style={styles.group}>
          <SectionLabel title="Fasting" />
          <TapRow label="Default goal" value={`${defaultGoal}h`} onPress={() => setShowGoalModal(true)} />
          <ToggleRow label="Reminder at goal" value={reminderAtGoal} onToggle={() => setReminderAtGoal(v => !v)} />
          <ToggleRow label="Start reminder"   value={startReminder}  onToggle={() => setStartReminder(v => !v)} />
        </View>

        {/* Appearance */}
        <View style={styles.group}>
          <SectionLabel title="Appearance" />
          <TapRow label="Week starts on" value={weekStart}    onPress={() => setShowWeekPicker(true)} />
          <TapRow label="Time format"    value={timeFormat}   onPress={() => setShowTimePicker(true)} />
        </View>

        {/* Data */}
        <View style={styles.group}>
          <SectionLabel title="Data" />
          <TapRow label="Export data" value="↓" onPress={handleExport} />
          <TapRow label="Import data" value="↑" onPress={handleImport} />
        </View>

        {/* Danger zone */}
        <View style={styles.group}>
          <SectionLabel title="Danger Zone" />
          <TapRow label="Reset all data" onPress={handleReset} danger />
        </View>
      </ScrollView>

      <PickerModal<WeekStart>
        visible={showWeekPicker}
        title="Week starts on"
        options={[
          { label: 'Monday', value: 'Monday' },
          { label: 'Sunday', value: 'Sunday' },
        ]}
        selected={weekStart}
        onSelect={setWeekStart}
        onClose={() => setShowWeekPicker(false)}
      />

      <PickerModal<TimeFormat>
        visible={showTimePicker}
        title="Time format"
        options={[
          { label: '24-hour (14:30)', value: '24h' },
          { label: '12-hour (2:30 pm)', value: '12h' },
        ]}
        selected={timeFormat}
        onSelect={setTimeFormat}
        onClose={() => setShowTimePicker(false)}
      />

      <GoalModal
        visible={showGoalModal}
        value={defaultGoal}
        onConfirm={setDefaultGoal}
        onClose={() => setShowGoalModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
  },
  screenLabel: {
    fontSize: 9, color: Colors.textMuted, fontFamily: FONT,
    letterSpacing: 0.16 * 9, textTransform: 'uppercase',
  },
  group:        { marginBottom: 8 },
  sectionLabel: {
    fontSize: 9, color: Colors.textMuted, fontFamily: FONT,
    letterSpacing: 0.16 * 9, textTransform: 'uppercase',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  rowLabel:       { fontSize: 14, color: Colors.textPrimary, fontFamily: FONT },
  rowLabelDanger: { color: Colors.red },
  rowValue:       { fontSize: 14, color: Colors.textMuted, fontFamily: FONT },
});

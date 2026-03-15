import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const [pushAlerts, setPushAlerts] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rowCard}>
        <Text style={styles.rowTitle}>Push Alerts</Text>
        <Switch value={pushAlerts} onValueChange={setPushAlerts} />
      </View>

      <View style={styles.rowCard}>
        <Text style={styles.rowTitle}>Auto Accept Priority Incidents</Text>
        <Switch value={autoAccept} onValueChange={setAutoAccept} />
      </View>

      <Pressable style={styles.actionCard}>
        <Text style={styles.actionTitle}>Update Availability</Text>
        <Text style={styles.actionSub}>Set on-duty, break, or off-duty status.</Text>
      </Pressable>

      <Pressable style={styles.actionCard}>
        <Text style={styles.actionTitle}>Device & Security</Text>
        <Text style={styles.actionSub}>Manage pin lock and trusted devices.</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    width: '70%',
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    padding: 14,
    gap: 6,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { AuthUser } from '../types';

export function ProfileScreen({ user }: { user: AuthUser }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(user.badge_id || 'R').slice(0, 3)}</Text>
      </View>

      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.callsign}>{user.badge_id || 'Responder'}</Text>

      <View style={styles.card}>
        <Field label="Role" value={user.role} />
        <Field label="Business" value={user.business_code} />
        <Field label="Station" value="Central Operations" />
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    height: 86,
    width: 86,
    borderRadius: 43,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  avatarText: {
    color: '#191919',
    fontWeight: '700',
    fontSize: 24,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 24,
  },
  callsign: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: colors.textMuted,
  },
  fieldValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { UserSession } from '../types';

type HomeScreenProps = {
  session: UserSession;
  onOpenEventSelect: () => void;
  onLogout: () => void;
};

export function HomeScreen({ session, onOpenEventSelect, onLogout }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome {session.user.name || 'User'}</Text>
        <Text style={styles.sub}>Phone: {session.user.phone}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onOpenEventSelect}>
        <Text style={styles.primaryButtonText}>Select Event & Report Incident</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onLogout}>
        <Text style={styles.secondaryText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 16,
    justifyContent: 'center',
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 10,
  },
  sub: {
    color: colors.textMuted,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#171717',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: colors.card,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HOME_SHORTCUTS } from '../data/mockData';
import { colors } from '../theme/colors';
import { AuthUser, ResponderIncident } from '../types';

type HomeScreenProps = {
  user: AuthUser;
  incidents: ResponderIncident[];
  onOpenIncident: (incidentId: string) => void;
  onOpenNotifications: () => void;
};

export function HomeScreen({
  user,
  incidents,
  onOpenIncident,
  onOpenNotifications,
}: HomeScreenProps) {
  const topIncidents = incidents.slice(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingCard}>
        <Text style={styles.muted}>Hi there 👋</Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.callsign}>{user.badge_id || 'Responder'}</Text>
      </View>

      <View style={styles.grid}>
        {HOME_SHORTCUTS.map(shortcut => (
          <Pressable key={shortcut.id} style={styles.gridCard}>
            <Text style={styles.gridTitle}>{shortcut.label}</Text>
            <Text style={styles.gridSub}>{shortcut.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Assigned Now</Text>
        <Pressable onPress={onOpenNotifications}>
          <Text style={styles.link}>Messages •</Text>
        </Pressable>
      </View>

      {topIncidents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.incidentMeta}>No assigned incidents right now.</Text>
        </View>
      ) : (
        topIncidents.map(incident => (
          <Pressable
            key={incident.id}
            style={styles.incidentCard}
            onPress={() => onOpenIncident(incident.id)}
          >
            <View>
              <Text style={styles.incidentTitle}>{formatIncidentTitle(incident.type)}</Text>
              <Text style={styles.incidentMeta}>
                {incident.camera_location_name || incident.camera_name || 'Unknown location'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function formatIncidentTitle(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  greetingCard: {
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 3,
  },
  callsign: {
    color: colors.accent,
    marginTop: 6,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  gridCard: {
    width: '48.5%',
    borderRadius: 18,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    minHeight: 90,
    padding: 12,
    justifyContent: 'space-between',
  },
  gridTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  gridSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  incidentCard: {
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  incidentTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  incidentMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 25,
    marginTop: -2,
  },
});

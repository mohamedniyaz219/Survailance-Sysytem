import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResponderIncident } from '../types';
import { colors } from '../theme/colors';

type AssignedIncidentsScreenProps = {
  incidents: ResponderIncident[];
  loading: boolean;
  onOpenIncident: (incidentId: string) => void;
};

export function AssignedIncidentsScreen({
  incidents,
  loading,
  onOpenIncident,
}: AssignedIncidentsScreenProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.sub}>Loading incidents...</Text>
      </View>
    );
  }

  if (incidents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.sub}>No incidents assigned to you.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {incidents.map(incident => (
        <Pressable
          key={incident.id}
          style={styles.card}
          onPress={() => onOpenIncident(incident.id)}
        >
          <View style={styles.headerRow}>
            <Text style={styles.incidentId}>{incident.id}</Text>
            <View style={[styles.priorityChip, priorityStyle(incident.status)]}>
              <Text style={styles.priorityText}>{incident.status}</Text>
            </View>
          </View>

          <Text style={styles.title}>{formatIncidentTitle(incident.type)}</Text>
          <Text style={styles.sub}>{incident.camera_location_name || 'Unknown location'}</Text>

          <View style={styles.footerRow}>
            <Text style={styles.status}>{incident.verification_status}</Text>
            <Text style={styles.time}>{formatTimestamp(incident.createdAt)}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function formatIncidentTitle(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function priorityStyle(status: ResponderIncident['status']) {
  if (status === 'false_alarm') {
    return { backgroundColor: 'rgba(241,102,102,0.16)' };
  }
  if (status === 'resolved') {
    return { backgroundColor: 'rgba(80,216,144,0.16)' };
  }
  if (status === 'assigned') {
    return { backgroundColor: 'rgba(243,189,87,0.16)' };
  }
  return { backgroundColor: 'rgba(174,179,189,0.16)' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentId: {
    color: colors.accentSoft,
    fontWeight: '700',
  },
  priorityChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  sub: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footerRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    color: colors.success,
    fontWeight: '600',
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

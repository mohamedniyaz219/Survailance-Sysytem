import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { EventItem } from '../types';

export function NotificationsScreen({ events }: { events: EventItem[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No active updates.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {events.map(event => (
        <View key={event.id} style={styles.card}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.text}>{event.description || 'Event update available.'}</Text>
          <Text style={styles.meta}>
            {event.location_name || 'Unknown location'} • {new Date(event.start_at).toLocaleString()}
          </Text>
        </View>
      ))}
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
    paddingBottom: 20,
    gap: 10,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  meta: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
});

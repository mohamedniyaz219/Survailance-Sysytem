import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { EventItem } from '../types';

type EventSelectScreenProps = {
  events: EventItem[];
  loading: boolean;
  onBack: () => void;
  onSelectEvent: (eventItem: EventItem) => void;
};

export function EventSelectScreen({
  events,
  loading,
  onBack,
  onSelectEvent,
}: EventSelectScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Select Event</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No active events available for this business code.</Text>
          ) : (
            events.map(eventItem => (
              <Pressable
                key={eventItem.id}
                style={styles.eventCard}
                onPress={() => onSelectEvent(eventItem)}
              >
                <Text style={styles.eventTitle}>{eventItem.title}</Text>
                <Text style={styles.eventMeta}>
                  {eventItem.location_name || 'Unknown location'}
                </Text>
                <Text style={styles.eventMeta}>
                  {new Date(eventItem.start_at).toLocaleString()}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  backButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: {
    color: colors.accent,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
  },
  spacer: {
    width: 54,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 20,
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
    gap: 3,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  eventMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

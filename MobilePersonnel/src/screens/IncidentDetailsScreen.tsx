import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { colors } from '../theme/colors';
import { AuthSession, ResponderIncident } from '../types';
import { fetchAlertNavigation, updateAlertStatus } from '../services/api';

type IncidentDetailsScreenProps = {
  incident: ResponderIncident;
  session: AuthSession;
  onStatusChanged: () => Promise<void>;
  onBack: () => void;
};

export function IncidentDetailsScreen({
  incident,
  session,
  onStatusChanged,
  onBack,
}: IncidentDetailsScreenProps) {
  const [navigationLoading, setNavigationLoading] = React.useState(false);
  const [statusLoading, setStatusLoading] = React.useState(false);

  const destination = {
    latitude: incident.lat ?? 37.7749,
    longitude: incident.lng ?? -122.4194,
  };

  const routeLine = [
    {
      latitude: destination.latitude + 0.0015,
      longitude: destination.longitude - 0.0015,
    },
    {
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
  ];

  const openDirections = async () => {
    try {
      setNavigationLoading(true);
      const response = await fetchAlertNavigation(session, incident.id);
      const url = Platform.select({
        ios: response.data.appleMapsUrl,
        android: `google.navigation:q=${response.data.destination.lat},${response.data.destination.lng}`,
        default: response.data.googleDirectionsUrl,
      });

      if (!url) {
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Directions unavailable', 'Unable to open maps on this device.');
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Directions error',
        error instanceof Error ? error.message : 'Unable to fetch navigation route.',
      );
    } finally {
      setNavigationLoading(false);
    }
  };

  const onSetStatus = async (status: 'assigned' | 'resolved') => {
    try {
      setStatusLoading(true);
      await updateAlertStatus(session, incident.id, status);
      await onStatusChanged();
      Alert.alert('Updated', `Incident marked as ${status}.`);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Unable to update incident status.',
      );
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.id}>{incident.id}</Text>
        <Text style={styles.title}>{incident.type}</Text>
        <Text style={styles.textMuted}>
          {incident.camera_location_name || incident.camera_name || 'Unknown location'}
        </Text>
        <Text style={styles.description}>{incident.description || 'No description provided.'}</Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: destination.latitude,
            longitude: destination.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={destination}
            title={incident.type}
            description={incident.camera_location_name || incident.camera_name || 'Incident location'}
          />
          <Polyline
            coordinates={routeLine}
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        </MapView>
      </View>

      <Pressable style={styles.primaryButton} onPress={openDirections} disabled={navigationLoading}>
        {navigationLoading ? (
          <ActivityIndicator color="#161616" />
        ) : (
          <Text style={styles.primaryButtonText}>Start Directions</Text>
        )}
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => onSetStatus('assigned')}
          disabled={statusLoading}
        >
          <Text style={styles.secondaryText}>Mark En Route</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => onSetStatus('resolved')}
          disabled={statusLoading}
        >
          <Text style={styles.secondaryText}>Mark Resolved</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  id: {
    color: colors.accent,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 21,
  },
  textMuted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  description: {
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 20,
  },
  mapWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    height: 290,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#161616',
    fontWeight: '700',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import { uploadReportMedia, submitUserReport } from '../services/api';
import { EventItem, UserSession } from '../types';

type ReportScreenProps = {
  session: UserSession;
  eventItem: EventItem;
  onBack: () => void;
  onSubmitted: () => void;
};

export function ReportScreen({ session, eventItem, onBack, onSubmitted }: ReportScreenProps) {
  const [incidentType, setIncidentType] = useState('suspicious_activity');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);

  const pickMedia = async (target: 'photo' | 'video') => {
    const response = await launchImageLibrary({
      mediaType: target,
      selectionLimit: 1,
    });

    const first = response.assets?.[0];
    if (!first?.uri) {
      return;
    }

    setMediaUri(first.uri);
    setMediaType(target);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') {
      Geolocation.requestAuthorization();
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const getCurrentLocation = () =>
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => reject(new Error(error.message)),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        },
      );
    });

  const submitReport = async () => {
    if (!incidentType.trim()) {
      Alert.alert('Missing type', 'Incident type is required.');
      return;
    }

    try {
      setLoading(true);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Location denied', 'Location permission is required to submit report.');
        return;
      }

      const { latitude, longitude } = await getCurrentLocation();

      let uploadedMediaUrl: string | null = null;
      let uploadedMediaType: 'photo' | 'video' | 'unknown' = 'unknown';

      if (mediaUri && (mediaType === 'photo' || mediaType === 'video')) {
        const media = await uploadReportMedia(session, mediaUri, mediaType);
        uploadedMediaUrl = media.media_url;
        uploadedMediaType = media.media_type;
      }

      await submitUserReport(session, {
        event_id: eventItem.id,
        incident_type: incidentType.trim(),
        description: description.trim(),
        location_name: locationName.trim() || eventItem.location_name || '',
        lat: latitude,
        lng: longitude,
        media_url: uploadedMediaUrl,
        media_type: uploadedMediaType,
      });

      Alert.alert('Submitted', 'Your incident report has been submitted.');
      onSubmitted();
    } catch (error) {
      Alert.alert('Submit failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.eventLabel}>Event: {eventItem.title}</Text>
        <Text style={styles.eventSub}>{eventItem.location_name || 'Unknown location'}</Text>

        <Text style={styles.label}>Incident Type</Text>
        <TextInput
          style={styles.input}
          value={incidentType}
          onChangeText={setIncidentType}
          placeholder="fire / crowd / accident"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="What happened?"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Location Name</Text>
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Street / landmark"
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.uploadRow}>
          <Pressable style={styles.secondaryButton} onPress={() => pickMedia('photo')}>
            <Text style={styles.secondaryText}>Upload Photo</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => pickMedia('video')}>
            <Text style={styles.secondaryText}>Upload Video</Text>
          </Pressable>
        </View>

        <Text style={styles.mediaText}>
          {mediaUri ? `Selected ${mediaType}` : 'No media selected'}
        </Text>

        <Pressable style={styles.primaryButton} onPress={submitReport} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#171717" />
          ) : (
            <Text style={styles.primaryText}>Submit Incident Report</Text>
          )}
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
    paddingBottom: 20,
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
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
  },
  eventLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
  },
  eventSub: {
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 8,
  },
  label: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  uploadRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.bgSecondary,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mediaText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryText: {
    color: '#171717',
    fontWeight: '700',
  },
});

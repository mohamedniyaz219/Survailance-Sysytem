import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssignedIncidentsScreen } from './src/screens/AssignedIncidentsScreen';
import { IncidentDetailsScreen } from './src/screens/IncidentDetailsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { fetchResponderAlerts, fetchResponderEvents } from './src/services/api';
import { AuthSession, EventItem, ResponderIncident } from './src/types';

type AppTab = 'Home' | 'Incidents' | 'Settings';
type ScreenState = 'Main' | 'IncidentDetails' | 'Profile' | 'Notifications';

function ResponderAppShell({
  user,
  incidents,
  loading,
  onOpenIncident,
  onOpenProfile,
  onOpenNotifications,
}: {
  user: AuthSession['user'];
  incidents: ResponderIncident[];
  loading: boolean;
  onOpenIncident: (incidentId: string) => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');

  const title = useMemo(() => {
    if (activeTab === 'Incidents') {
      return 'Assigned Incidents';
    }
    if (activeTab === 'Settings') {
      return 'Settings';
    }
    return 'Responder Console';
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable style={styles.headerButton} onPress={onOpenProfile}>
          <Text style={styles.headerButtonText}>Profile</Text>
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'Home' ? (
          <HomeScreen
            user={user}
            incidents={incidents}
            onOpenNotifications={onOpenNotifications}
            onOpenIncident={onOpenIncident}
          />
        ) : null}

        {activeTab === 'Incidents' ? (
          <AssignedIncidentsScreen
            incidents={incidents}
            loading={loading}
            onOpenIncident={onOpenIncident}
          />
        ) : null}

        {activeTab === 'Settings' ? <SettingsScreen /> : null}
      </View>

      <SafeAreaView style={styles.tabArea} edges={['bottom']}>
        <View style={styles.tabBar}>
          <TabButton
            label="Home"
            icon="⌂"
            active={activeTab === 'Home'}
            onPress={() => setActiveTab('Home')}
          />
          <TabButton
            label="Incidents"
            icon="▤"
            active={activeTab === 'Incidents'}
            onPress={() => setActiveTab('Incidents')}
          />
          <TabButton
            label="Settings"
            icon="☰"
            active={activeTab === 'Settings'}
            onPress={() => setActiveTab('Settings')}
          />
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tabButton, active ? styles.tabButtonActive : undefined]}
      onPress={onPress}
    >
      <Text style={[styles.tabIcon, active ? styles.activeText : undefined]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, active ? styles.activeText : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [incidents, setIncidents] = useState<ResponderIncident[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('Main');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );

  const selectedIncident = incidents.find(item => item.id === selectedIncidentId) || null;

  const refreshLiveData = useCallback(
    async (silently = false) => {
      if (!session) {
        return;
      }

      try {
        if (!silently) {
          setLoading(true);
        }
        const [alertsPayload, eventsPayload] = await Promise.all([
          fetchResponderAlerts(session),
          fetchResponderEvents(session),
        ]);
        setIncidents(alertsPayload.data);
        setEvents(eventsPayload.data || []);
        setRefreshError(null);
      } catch (error) {
        setRefreshError(
          error instanceof Error ? error.message : 'Unable to refresh responder data.',
        );
      } finally {
        if (!silently) {
          setLoading(false);
        }
      }
    },
    [session],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    refreshLiveData();

    const intervalId = setInterval(() => {
      refreshLiveData(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [session, refreshLiveData]);

  const onOpenIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentScreen('IncidentDetails');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      {!session ? (
        <LoginScreen
          onLoginSuccess={authSession => {
            setSession(authSession);
            setCurrentScreen('Main');
          }}
        />
      ) : null}

      {session && refreshError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{refreshError}</Text>
        </View>
      ) : null}

      {session && currentScreen === 'Main' ? (
        <ResponderAppShell
          user={session.user}
          incidents={incidents}
          loading={loading}
          onOpenIncident={onOpenIncident}
          onOpenProfile={() => setCurrentScreen('Profile')}
          onOpenNotifications={() => setCurrentScreen('Notifications')}
        />
      ) : null}

      {session && currentScreen === 'IncidentDetails' && selectedIncident ? (
        <IncidentDetailsScreen
          incident={selectedIncident}
          session={session}
          onStatusChanged={async () => {
            await refreshLiveData();
            setCurrentScreen('Main');
          }}
          onBack={() => setCurrentScreen('Main')}
        />
      ) : null}

      {session && currentScreen === 'Profile' ? (
        <SimpleScreenLayout title="Profile" onBack={() => setCurrentScreen('Main')}>
          <ProfileScreen user={session.user} />
        </SimpleScreenLayout>
      ) : null}

      {session && currentScreen === 'Notifications' ? (
        <SimpleScreenLayout
          title="Notifications"
          onBack={() => setCurrentScreen('Main')}
        >
          <NotificationsScreen events={events} />
        </SimpleScreenLayout>
      ) : null}
    </SafeAreaProvider>
  );
}

function SimpleScreenLayout({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Text style={styles.headerButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </SafeAreaView>
  );
}

const textBase: TextStyle = {
  color: colors.textPrimary,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...textBase,
    fontSize: 24,
    fontWeight: '700',
  },
  headerButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  headerButtonText: {
    ...textBase,
    color: colors.accent,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 70,
  },
  contentContainer: {
    flex: 1,
  },
  tabArea: {
    backgroundColor: colors.bgPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: colors.card,
  },
  tabIcon: {
    ...textBase,
    color: colors.textMuted,
    fontSize: 15,
  },
  tabLabel: {
    ...textBase,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: colors.accent,
  },
  errorBanner: {
    backgroundColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

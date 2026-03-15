import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from './src/screens/AuthScreen';
import { EventSelectScreen } from './src/screens/EventSelectScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { fetchAvailableEvents } from './src/services/api';
import { colors } from './src/theme/colors';
import { EventItem, UserSession } from './src/types';

type Screen = 'home' | 'events' | 'report';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const openEvents = async () => {
    if (!session) {
      return;
    }

    setScreen('events');
    setEventsLoading(true);
    try {
      const list = await fetchAvailableEvents(session);
      setEvents(list);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {!session ? <AuthScreen onAuthenticated={setSession} /> : null}

      {session && screen === 'home' ? (
        <HomeScreen
          session={session}
          onOpenEventSelect={openEvents}
          onLogout={() => {
            setSession(null);
            setScreen('home');
            setSelectedEvent(null);
          }}
        />
      ) : null}

      {session && screen === 'events' ? (
        <EventSelectScreen
          events={events}
          loading={eventsLoading}
          onBack={() => setScreen('home')}
          onSelectEvent={eventItem => {
            setSelectedEvent(eventItem);
            setScreen('report');
          }}
        />
      ) : null}

      {session && screen === 'report' && selectedEvent ? (
        <ReportScreen
          session={session}
          eventItem={selectedEvent}
          onBack={() => setScreen('events')}
          onSubmitted={() => {
            setScreen('home');
            setSelectedEvent(null);
          }}
        />
      ) : null}

      <View />
    </SafeAreaProvider>
  );
}

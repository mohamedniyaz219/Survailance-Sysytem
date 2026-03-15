import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { loginUser, registerUser } from '../services/api';
import { UserSession } from '../types';

type AuthScreenProps = {
  onAuthenticated: (session: UserSession) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Phone and password are required.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      Alert.alert('Missing name', 'Name is required for registration.');
      return;
    }

    try {
      setLoading(true);
      const authResponse =
        mode === 'register'
          ? await registerUser({
              phone: phone.trim(),
              password,
              name: name.trim(),
              home_city: homeCity.trim() || undefined,
            })
          : await loginUser({ phone: phone.trim(), password });

      onAuthenticated({
        token: authResponse.token,
        user: authResponse.user,
      });
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Citizen App</Text>
        <Text style={styles.subtitle}>Login or register to report incidents</Text>

        <View style={styles.switchRow}>
          <Pressable
            style={[styles.switchButton, mode === 'login' ? styles.switchActive : undefined]}
            onPress={() => setMode('login')}
          >
            <Text style={styles.switchText}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.switchButton, mode === 'register' ? styles.switchActive : undefined]}
            onPress={() => setMode('register')}
          >
            <Text style={styles.switchText}>Register</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="9876543210"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
        />

        {mode === 'register' ? (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Home City</Text>
            <TextInput
              style={styles.input}
              value={homeCity}
              onChangeText={setHomeCity}
              placeholder="City"
              placeholderTextColor={colors.textMuted}
            />
          </>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#171717" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'register' ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 28,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  switchButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  switchActive: {
    backgroundColor: colors.accent,
  },
  switchText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  label: {
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#171717',
    fontWeight: '700',
  },
});

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
import { loginOfficial } from '../services/api';
import { AuthSession } from '../types';

type LoginScreenProps = {
  onLoginSuccess: (session: AuthSession) => void;
};

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [businessCode, setBusinessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const normalizedBusinessCode = businessCode.trim().toUpperCase();

    if (!normalizedBusinessCode || !email.trim() || !password.trim()) {
      Alert.alert(
        'Missing fields',
        'Enter business code, email, and password to continue.',
      );
      return;
    }

    try {
      setLoading(true);
      const session = await loginOfficial(normalizedBusinessCode, email, password);
      onLoginSuccess(session);
    } catch (error) {
      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'Unable to reach backend. Ensure server is running on port 3000.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Responder App</Text>
        <Text style={styles.heroSubtitle}>Secure incident response access</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Business Code</Text>
        <TextInput
          value={businessCode}
          onChangeText={setBusinessCode}
          style={styles.input}
          placeholder="ORG-001"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="responder@org.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
        />

        <Pressable
          style={[styles.primaryButton, loading ? styles.primaryButtonDisabled : undefined]}
          onPress={onLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#171717" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </Pressable>

        <Text style={styles.footText}>Only authorized response personnel can continue.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 18,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 22,
    padding: 18,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#171717',
    fontWeight: '700',
    fontSize: 16,
  },
  footText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
});

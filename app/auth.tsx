import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { Wordmark } from '@/components/Wordmark';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    // Redirect back into the app after the user clicks the link.
    // On device this resolves to fasttrack:// ; in Expo Go to exp://…
    const redirectTo = Linking.createURL('/');

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError(null);
    setSent(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.wordmarkWrap}>
            <Wordmark />
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Sign in</Text>
            <Text style={styles.sub}>
              Enter your email and we'll send you a magic link.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!loading}
            />

            {error !== null && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {sent && (
              <Text style={styles.successText}>
                Check your email for a login link
              </Text>
            )}

            <TouchableOpacity
              style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
              onPress={handleSend}
              activeOpacity={0.85}
              disabled={!email.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Send magic link</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 36,
  },
  wordmarkWrap: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  sub: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: FONT,
    lineHeight: 20,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: FONT,
  },
  errorText: {
    fontSize: 13,
    color: Colors.coral,
    fontFamily: FONT,
  },
  successText: {
    fontSize: 13,
    color: Colors.green,
    fontWeight: '500',
    fontFamily: FONT,
  },
  btn: {
    backgroundColor: Colors.coral,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT,
    letterSpacing: 0.3,
  },
});

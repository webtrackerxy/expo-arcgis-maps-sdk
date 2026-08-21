import {
  authenticate,
  authenticateWithOAuth,
  signOut,
  type PortalUser,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Set these to your registered ArcGIS OAuth application to exercise OAuth. The
// redirect URI must match the config plugin's `oauthRedirectUri` in app.json.
const OAUTH_CLIENT_ID = '';
const OAUTH_REDIRECT_URI = 'expo-arcgis-example://auth';

/**
 * Exercises token (named-user) authentication via `authenticate` / `signOut`,
 * plus interactive OAuth via `authenticateWithOAuth`. Credentials are stored
 * natively; only the non-sensitive profile is returned to JS.
 */
export function AuthScreen({ ready }: ScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [info, setInfo] = useState('Enter ArcGIS portal credentials, then sign in.');

  async function signIn() {
    try {
      const result = await authenticate({ username, password });
      setUser(result);
      setInfo(`Signed in as ${result.fullName ?? result.username}.`);
    } catch (error) {
      setUser(null);
      setInfo(`sign-in failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function signInOAuth() {
    if (!OAUTH_CLIENT_ID) {
      setInfo('Set OAUTH_CLIENT_ID (a registered ArcGIS OAuth app) to try OAuth sign-in.');
      return;
    }
    setInfo('Opening browser for OAuth sign-in…');
    try {
      const result = await authenticateWithOAuth({
        clientId: OAUTH_CLIENT_ID,
        redirectUri: OAUTH_REDIRECT_URI,
      });
      setUser(result);
      setInfo(`Signed in via OAuth as ${result.fullName ?? result.username}.`);
    } catch (error) {
      setUser(null);
      setInfo(`OAuth sign-in failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function signOutUser() {
    try {
      await signOut();
      setUser(null);
      setInfo('Signed out.');
    } catch (error) {
      setInfo(`sign-out failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttons}>
        <Button title="Sign in" onPress={signIn} disabled={!username || !password} />
        <Button title="Sign out" onPress={signOutUser} />
      </View>
      <Button title="Sign in with OAuth" onPress={signInOAuth} />
      {user ? <Text style={styles.detail}>{user.email ?? user.username}</Text> : null}
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around' },
  detail: { textAlign: 'center', color: '#333' },
});

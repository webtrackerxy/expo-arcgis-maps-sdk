/**
 * Enterprise authentication screens — Integrated Windows Authentication (IWA)
 * and PKI (client certificate) against an on-premises ArcGIS Enterprise portal.
 *
 * Both require enterprise infrastructure that ArcGIS Online cannot stand in for
 * (an IWA/PKI-protected portal, and for PKI a provisioned client certificate),
 * so out of the box these screens demonstrate the expected authentication
 * *failure* path. Point them at a real protected portal to exercise success.
 */
import { authenticateWithIWA, authenticateWithPKI, type PortalUser } from 'expo-arcgis-maps-sdk';
import { Platform } from 'expo-modules-core';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** `Authenticate with Integrated Windows Authentication` — NTLM / Negotiate sign-in. */
export function IwaAuthScreen({ ready }: ScreenProps) {
  const [portalUrl, setPortalUrl] = useState('https://webadaptor.example.com/portal');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [info, setInfo] = useState('Enter an IWA-protected portal and Windows credentials.');

  async function signIn() {
    setInfo('Authenticating…');
    try {
      const result = await authenticateWithIWA({ portalUrl, username, password });
      setUser(result);
      setInfo(`Signed in as ${result.fullName ?? result.username}.`);
    } catch (error) {
      setUser(null);
      setInfo(`IWA sign-in failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Portal URL"
        autoCapitalize="none"
        autoCorrect={false}
        value={portalUrl}
        onChangeText={setPortalUrl}
      />
      <TextInput
        style={styles.input}
        placeholder="DOMAIN\username"
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
      <Button title="Sign in with IWA" onPress={signIn} disabled={!portalUrl || !username} />
      {user ? <Text style={styles.detail}>{user.email ?? user.username}</Text> : null}
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/** `Authenticate with PKI certificate` — client-certificate sign-in. */
export function PkiAuthScreen({ ready }: ScreenProps) {
  const [portalUrl, setPortalUrl] = useState('https://webadaptor.example.com/portal');
  // iOS reads a PKCS#12 file; Android references a system-KeyChain alias.
  const [certificate, setCertificate] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<PortalUser | null>(null);
  const isIos = Platform.OS === 'ios';
  const [info, setInfo] = useState(
    isIos
      ? 'Enter a PKI-protected portal and a PKCS#12 certificate file path.'
      : 'Enter a PKI-protected portal and a system-KeyChain certificate alias.'
  );

  async function signIn() {
    setInfo('Authenticating…');
    try {
      const result = await authenticateWithPKI({
        portalUrl,
        certificatePath: isIos ? certificate : undefined,
        password: isIos ? password : undefined,
        certificateAlias: isIos ? undefined : certificate,
      });
      setUser(result);
      setInfo(`Signed in as ${result.fullName ?? result.username}.`);
    } catch (error) {
      setUser(null);
      setInfo(`PKI sign-in failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Portal URL"
        autoCapitalize="none"
        autoCorrect={false}
        value={portalUrl}
        onChangeText={setPortalUrl}
      />
      <TextInput
        style={styles.input}
        placeholder={isIos ? 'Certificate file path (.pfx)' : 'KeyChain certificate alias'}
        autoCapitalize="none"
        autoCorrect={false}
        value={certificate}
        onChangeText={setCertificate}
      />
      {isIos ? (
        <TextInput
          style={styles.input}
          placeholder="Certificate password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />
      ) : null}
      <Button title="Sign in with PKI" onPress={signIn} disabled={!portalUrl || !certificate} />
      {user ? <Text style={styles.detail}>{user.email ?? user.username}</Text> : null}
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 16 },
  detail: { textAlign: 'center', color: '#333' },
});

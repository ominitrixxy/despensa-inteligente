import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { authApi } from '../../src/api/client';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/store/auth';
import { colors } from '../../src/theme';

export default function Login() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await setSession(await authApi.login(email.trim(), password));
    } catch (e) {
      Alert.alert('Não foi possível entrar', e instanceof Error ? e.message : 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 56 }}>🥕</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>Despensa Inteligente</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>Menos desperdício, mais sabor.</Text>
        </View>
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Entrar" onPress={submit} loading={loading} disabled={!email || !password} />
        <Link href="/register" style={{ textAlign: 'center', marginTop: 20, color: colors.primary, fontWeight: '700' }}>
          Criar conta
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

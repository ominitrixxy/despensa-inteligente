import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { authApi } from '../../src/api/client';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/store/auth';
import { colors } from '../../src/theme';

export default function Register() {
  const setSession = useAuth((s) => s.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await setSession(await authApi.register(name.trim(), email.trim(), password));
    } catch (e) {
      Alert.alert('Não foi possível cadastrar', e instanceof Error ? e.message : 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 24 }}>Criar conta</Text>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Senha (mín. 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
        <Button
          title="Cadastrar"
          onPress={submit}
          loading={loading}
          disabled={!name || !email || password.length < 8}
        />
        <Link href="/login" style={{ textAlign: 'center', marginTop: 20, color: colors.primary, fontWeight: '700' }}>
          Já tenho conta
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

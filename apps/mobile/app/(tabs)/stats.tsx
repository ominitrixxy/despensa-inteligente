import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { authApi } from '../../src/api/client';
import { useProfile, useUpdateProfile, useWasteStats } from '../../src/api/hooks';
import { Button, Card } from '../../src/components/ui';
import { useAuth } from '../../src/store/auth';
import { colors } from '../../src/theme';

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 30, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Stepper({ label, value, onChange, min, max, suffix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  const btn = { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
      <Pressable style={btn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={{ fontSize: 20, color: colors.primary }}>−</Text>
      </Pressable>
      <Text style={{ width: 70, textAlign: 'center', fontWeight: '700' }}>{value}{suffix}</Text>
      <Pressable style={btn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={{ fontSize: 20, color: colors.primary }}>+</Text>
      </Pressable>
    </View>
  );
}

export default function Profile() {
  const { session, logout } = useAuth();
  const qc = useQueryClient();
  const stats = useWasteStats(30);
  const profile = useProfile();
  const update = useUpdateProfile();

  const doLogout = async () => {
    if (session) await authApi.logout(session.refreshToken);
    qc.clear();
    await logout();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 2 }}>Olá, {session?.user.name} 👋</Text>
      <Text style={{ color: colors.muted, marginBottom: 16 }}>{session?.user.email}</Text>

      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Últimos 30 dias</Text>
      <Card>
        {stats.isLoading || !stats.data ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <View style={{ flexDirection: 'row' }}>
              <Stat label="Consumidos" value={stats.data.consumed} color={colors.ok} />
              <Stat label="Descartados" value={stats.data.discarded} color={colors.danger} />
              <Stat label="Na despensa" value={stats.data.active} color={colors.text} />
            </View>
            <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 12 }}>
              Taxa de desperdício: {Math.round(stats.data.wasteRate * 100)}%
            </Text>
          </>
        )}
      </Card>

      <Text style={{ fontWeight: '700', marginTop: 12, marginBottom: 8 }}>Notificações</Text>
      <Card>
        {profile.data ? (
          <>
            <Stepper
              label="Horário do aviso diário"
              value={profile.data.notifyHour}
              min={0}
              max={23}
              suffix="h"
              onChange={(v) => update.mutate({ notifyHour: v })}
            />
            <Stepper
              label="Avisar com antecedência de"
              value={profile.data.notifyDaysBefore}
              min={1}
              max={30}
              suffix=" dias"
              onChange={(v) => update.mutate({ notifyDaysBefore: v })}
            />
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Card>

      <View style={{ marginTop: 24 }}>
        <Button title="Sair" variant="outline" onPress={doLogout} />
      </View>
    </ScrollView>
  );
}

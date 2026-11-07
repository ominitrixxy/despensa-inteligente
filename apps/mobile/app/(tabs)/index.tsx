import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useProducts, useSetProductStatus } from '../../src/api/hooks';
import { ProductCard } from '../../src/components/ProductCard';
import { Chip, Empty } from '../../src/components/ui';
import { colors } from '../../src/theme';

const FILTERS = [
  { label: 'Tudo', value: undefined },
  { label: '❄️ Geladeira', value: 'geladeira' },
  { label: '🧊 Freezer', value: 'freezer' },
  { label: '🗄️ Armário', value: 'armario' },
] as const;

export default function Pantry() {
  const router = useRouter();
  const [location, setLocation] = useState<string | undefined>();
  const { data, isLoading, isRefetching, refetch, error } = useProducts(location);
  const setStatus = useSetProductStatus();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8 }}>
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} selected={location === f.value} onPress={() => setLocation(f.value)} />
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : error ? (
        <Empty title="Não foi possível carregar" subtitle={error.message} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<Empty title="Despensa vazia" subtitle="Toque em + para adicionar o primeiro item." />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onConsume={() => setStatus.mutate({ id: item.id, status: 'consumed' })}
              onDiscard={() => setStatus.mutate({ id: item.id, status: 'discarded' })}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/product/new')}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ color: '#fff', fontSize: 32, marginTop: -2 }}>+</Text>
      </Pressable>
    </View>
  );
}

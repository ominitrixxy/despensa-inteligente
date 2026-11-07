import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRecipe, useRecipeSuggestions } from '../../src/api/hooks';
import { Card, Empty } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function Recipes() {
  const { data, isLoading, isRefetching, refetch } = useRecipeSuggestions();
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useRecipe(openId);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      ListHeaderComponent={
        <Text style={{ color: colors.muted, marginBottom: 12 }}>
          Sugestões que priorizam os itens que vencem primeiro.
        </Text>
      }
      ListEmptyComponent={
        <Empty title="Sem sugestões ainda" subtitle="Cadastre itens na despensa para ver receitas que aproveitam o que você tem." />
      }
      renderItem={({ item }) => {
        const open = openId === item.id;
        return (
          <Pressable onPress={() => setOpenId(open ? null : item.id)}>
            <Card>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.title}</Text>
              {item.prepMinutes ? (
                <Text style={{ color: colors.muted, marginTop: 2 }}>⏱ {item.prepMinutes} min</Text>
              ) : null}
              <Text style={{ color: colors.ok, marginTop: 8, fontWeight: '600' }}>
                ✓ Você tem: {item.matchedIngredients.join(', ')}
              </Text>
              {item.missingIngredients.length ? (
                <Text style={{ color: colors.muted, marginTop: 2 }}>
                  Falta: {item.missingIngredients.join(', ')}
                </Text>
              ) : null}
              {open ? (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  {detail.isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={{ color: colors.text, lineHeight: 22 }}>{detail.data?.instructions}</Text>
                  )}
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}

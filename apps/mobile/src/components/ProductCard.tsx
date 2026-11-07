import type { Product } from '@despensa/shared-types';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { expiryInfo, formatDateBR } from '../utils/expiry';
import { Card } from './ui';

const LOCATION_LABEL = { geladeira: '❄️ Geladeira', freezer: '🧊 Freezer', armario: '🗄️ Armário' } as const;

export function ProductCard({
  product,
  onConsume,
  onDiscard,
}: {
  product: Product;
  onConsume: () => void;
  onDiscard: () => void;
}) {
  const info = expiryInfo(product.expiryDate);

  const confirmDiscard = () =>
    Alert.alert('Descartar item?', `"${product.name}" será marcado como desperdiçado.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onDiscard },
    ]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.bar, { backgroundColor: info.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {product.category?.icon ? `${product.category.icon} ` : ''}
            {product.name}
          </Text>
          <Text style={styles.meta}>
            {product.quantity} {product.unit} · {LOCATION_LABEL[product.location]}
            {product.brand ? ` · ${product.brand}` : ''}
          </Text>
          <Text style={[styles.expiry, { color: info.color }]}>
            {info.label} ({formatDateBR(product.expiryDate)})
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onConsume} style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>✓ Consumi</Text>
        </Pressable>
        <Pressable onPress={confirmDiscard} style={[styles.actionBtn, { backgroundColor: '#FDECEA' }]}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>🗑 Descartei</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3, marginRight: 12 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  expiry: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});

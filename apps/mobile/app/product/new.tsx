import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useCategories, useCreateProduct } from '../../src/api/hooks';
import { Button, Chip, Field } from '../../src/components/ui';
import { colors } from '../../src/theme';
import { parseDateInput } from '../../src/utils/expiry';

const UNITS = ['un', 'kg', 'g', 'l', 'ml'] as const;
const LOCATIONS = [
  { label: '❄️ Geladeira', value: 'geladeira' },
  { label: '🧊 Freezer', value: 'freezer' },
  { label: '🗄️ Armário', value: 'armario' },
] as const;

export default function NewProduct() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string; name?: string; brand?: string }>();
  const categories = useCategories();
  const create = useCreateProduct();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('un');
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]['value']>('geladeira');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [expiry, setExpiry] = useState('');

  // Preenche com o retorno do scanner
  useEffect(() => {
    if (params.barcode) setBarcode(params.barcode);
    if (params.name) setName(params.name);
    if (params.brand) setBrand(params.brand);
  }, [params.barcode, params.name, params.brand]);

  const selectedCategory = categories.data?.find((c) => c.id === categoryId);

  const submit = async () => {
    const expiryIso = expiry ? parseDateInput(expiry) : null;
    if (expiry && !expiryIso) return Alert.alert('Data inválida', 'Use o formato dd/mm/aaaa.');
    if (!expiryIso && !selectedCategory?.defaultShelfLifeDays) {
      return Alert.alert('Informe a validade', 'Digite a data de validade ou escolha uma categoria com validade padrão.');
    }
    const qty = Number(quantity.replace(',', '.'));
    if (!qty || qty <= 0) return Alert.alert('Quantidade inválida');

    try {
      await create.mutateAsync({
        name: name.trim(),
        brand: brand.trim() || undefined,
        barcode: barcode || undefined,
        quantity: qty,
        unit,
        location,
        categoryId,
        expiryDate: expiryIso ?? undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro ao salvar', e instanceof Error ? e.message : 'Tente novamente');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Button title="📷 Escanear código de barras" variant="outline" onPress={() => router.push('/scanner')} />
        <View style={{ height: 16 }} />

        <Field label="Nome *" value={name} onChangeText={setName} placeholder="Ex.: Iogurte natural" />
        <Field label="Marca" value={brand} onChangeText={setBrand} />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>Categoria</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          {categories.data?.map((c) => (
            <Chip
              key={c.id}
              label={`${c.icon ?? ''} ${c.name}`.trim()}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
            />
          ))}
        </View>
        {selectedCategory?.defaultShelfLifeDays ? (
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 14 }}>
            Se deixar a validade em branco, usaremos {selectedCategory.defaultShelfLifeDays} dias a partir de hoje.
          </Text>
        ) : null}

        <Field
          label="Validade (dd/mm/aaaa)"
          value={expiry}
          onChangeText={setExpiry}
          placeholder="31/12/2026"
          keyboardType="numbers-and-punctuation"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {UNITS.map((u) => (
            <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />
          ))}
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>Onde guardar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
          {LOCATIONS.map((l) => (
            <Chip key={l.value} label={l.label} selected={location === l.value} onPress={() => setLocation(l.value)} />
          ))}
        </View>

        <Button title="Salvar item" onPress={submit} loading={create.isPending} disabled={!name.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

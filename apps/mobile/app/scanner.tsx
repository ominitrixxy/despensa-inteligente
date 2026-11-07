import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { api } from '../src/api/client';
import { Button } from '../src/components/ui';

interface Lookup {
  barcode: string;
  name: string | null;
  brand: string | null;
}

export default function Scanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  if (!permission) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>
          Precisamos da câmera para ler o código de barras dos produtos.
        </Text>
        <Button title="Permitir câmera" onPress={requestPermission} />
      </View>
    );
  }

  const onScanned = async ({ data }: { data: string }) => {
    if (handled.current) return;
    handled.current = true;
    setBusy(true);
    try {
      const found = await api<Lookup>(`/products/barcode/${encodeURIComponent(data)}`);
      router.replace({
        pathname: '/product/new',
        params: { barcode: found.barcode, name: found.name ?? '', brand: found.brand ?? '' },
      });
    } catch {
      // Produto não está na base: segue com o código preenchido para cadastro manual
      Alert.alert('Produto não encontrado', 'Preencha os dados manualmente; o código foi guardado.');
      router.replace({ pathname: '/product/new', params: { barcode: data } });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.frame} />
      <Text style={styles.hint}>{busy ? 'Buscando produto…' : 'Aponte para o código de barras'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: '75%',
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
  },
  hint: { position: 'absolute', bottom: 80, alignSelf: 'center', color: '#fff', fontSize: 16, fontWeight: '600' },
});

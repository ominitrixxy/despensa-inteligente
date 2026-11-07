import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme';

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Despensa', tabBarIcon: icon('🧺') }} />
      <Tabs.Screen name="recipes" options={{ title: 'Receitas', tabBarIcon: icon('🍳') }} />
      <Tabs.Screen name="stats" options={{ title: 'Perfil', tabBarIcon: icon('📊') }} />
    </Tabs>
  );
}

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'despensa.session';

// No celular usa SecureStore; no navegador usa localStorage
// (SecureStore não existe na versão web).
const storage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') return window.localStorage.getItem(KEY);
    return SecureStore.getItemAsync(KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  },
  async remove(): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await storage.get();
      set({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
    } catch {
      set({ session: null, hydrated: true });
    }
  },
  setSession: async (session) => {
    await storage.set(JSON.stringify(session));
    set({ session });
  },
  logout: async () => {
    await storage.remove();
    set({ session: null });
  },
}));
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Category,
  Paginated,
  Product,
  ProductStatus,
  RecipeSuggestion,
  UserProfile,
  WasteStats,
} from '@despensa/shared-types';
import { api } from './client';

export function useProducts(location?: string) {
  const qs = new URLSearchParams({ status: 'active', sort: 'expiry_date', limit: '100' });
  if (location) qs.set('location', location);
  return useQuery({
    queryKey: ['products', location ?? 'all'],
    queryFn: () => api<Paginated<Product>>(`/products?${qs.toString()}`),
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api<Category[]>('/categories'), staleTime: 5 * 60_000 });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api<Product>('/products', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useSetProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: ProductStatus }) =>
      api<Product>(`/products/${vars.id}/status`, { method: 'PATCH', body: { status: vars.status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useRecipeSuggestions() {
  return useQuery({ queryKey: ['recipes', 'suggestions'], queryFn: () => api<RecipeSuggestion[]>('/recipes/suggestions') });
}

export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: ['recipes', id],
    enabled: !!id,
    queryFn: () => api<{ id: string; instructions: string }>(`/recipes/${id}`),
  });
}

export function useWasteStats(days = 30) {
  return useQuery({ queryKey: ['stats', days], queryFn: () => api<WasteStats>(`/stats/waste?days=${days}`) });
}

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: () => api<UserProfile>('/users/me') });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<UserProfile, 'notifyHour' | 'notifyDaysBefore'>>) =>
      api<UserProfile>('/users/me', { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

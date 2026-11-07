export type Unit = 'un' | 'kg' | 'g' | 'l' | 'ml';
export type StorageLocation = 'geladeira' | 'freezer' | 'armario';
export type ProductStatus = 'active' | 'consumed' | 'discarded';
export type AlertType = 'expiring_soon' | 'expired';

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  defaultShelfLifeDays: number | null;
}

export interface Product {
  id: string;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  name: string;
  brand: string | null;
  barcode: string | null;
  quantity: number;
  unit: Unit;
  purchaseDate: string | null;
  expiryDate: string;
  location: StorageLocation;
  status: ProductStatus;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: { id: string; name: string; email: string };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  notifyHour: number;
  notifyDaysBefore: number;
}

export interface AppAlert {
  id: string;
  productId: string;
  type: AlertType;
  scheduledFor: string;
  sentAt: string | null;
  readAt: string | null;
  product?: Pick<Product, 'id' | 'name' | 'expiryDate'>;
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  prepMinutes: number | null;
  imageUrl: string | null;
  score: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface WasteStats {
  periodDays: number;
  consumed: number;
  discarded: number;
  active: number;
  wasteRate: number; // 0..1 sobre (consumed + discarded)
}

import { colors } from '../theme';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Dias até a validade (negativo = vencido). Compara apenas datas (sem horário). */
export function daysUntil(expiryDate: string, now: Date = new Date()): number {
  const [y, m, d] = expiryDate.slice(0, 10).split('-').map(Number);
  const expiryUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiryUtc - todayUtc) / MS_PER_DAY);
}

export function expiryInfo(expiryDate: string) {
  const days = daysUntil(expiryDate);
  if (days < 0) {
    return { days, color: colors.danger, label: days === -1 ? 'Venceu ontem' : `Venceu há ${-days} dias` };
  }
  if (days === 0) return { days, color: colors.danger, label: 'Vence hoje' };
  if (days === 1) return { days, color: colors.warn, label: 'Vence amanhã' };
  if (days <= 3) return { days, color: colors.warn, label: `Vence em ${days} dias` };
  return { days, color: colors.ok, label: `Vence em ${days} dias` };
}

export function formatDateBR(expiryDate: string) {
  const [y, m, d] = expiryDate.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Converte "dd/mm/aaaa" ou "aaaa-mm-dd" em "aaaa-mm-dd"; retorna null se inválido. */
export function parseDateInput(value: string): string | null {
  const v = value.trim();
  let iso: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) iso = v;
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split('/');
    iso = `${y}-${m}-${d}`;
  }
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}

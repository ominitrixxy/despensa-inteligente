/**
 * Retorna hora e data (YYYY-MM-DD) locais de um instante em um fuso IANA.
 * Usado pelo cron horário para decidir quais usuários notificar.
 */
export function getLocalParts(timezone: string, now: Date = new Date()): { hour: number; ymd: string } {
  let tz = timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    tz = 'America/Sao_Paulo';
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    hour: Number(get('hour')),
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

/** Converte 'YYYY-MM-DD' em Date UTC à meia-noite (compatível com colunas @db.Date). */
export function ymdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Remove acentos, caixa e espaços extras para comparar nomes de ingredientes. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

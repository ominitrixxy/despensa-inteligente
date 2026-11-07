import { addDays, getLocalParts, normalizeName, ymdToUtcDate } from './date.util';

describe('date.util', () => {
  it('calcula hora e data locais em São Paulo (UTC-3)', () => {
    const now = new Date('2026-11-06T12:30:00.000Z'); // 09:30 em SP
    expect(getLocalParts('America/Sao_Paulo', now)).toEqual({ hour: 9, ymd: '2026-11-06' });
  });

  it('vira o dia corretamente em fusos diferentes', () => {
    const now = new Date('2026-11-06T02:00:00.000Z');
    expect(getLocalParts('America/Sao_Paulo', now)).toEqual({ hour: 23, ymd: '2026-11-05' });
    expect(getLocalParts('Asia/Tokyo', now)).toEqual({ hour: 11, ymd: '2026-11-06' });
  });

  it('usa fallback para fuso inválido', () => {
    const now = new Date('2026-11-06T12:00:00.000Z');
    expect(getLocalParts('Fuso/Invalido', now).hour).toBe(9);
  });

  it('soma dias em UTC', () => {
    expect(addDays(ymdToUtcDate('2026-11-30'), 3).toISOString()).toBe('2026-12-03T00:00:00.000Z');
  });

  it('normaliza nomes de ingredientes', () => {
    expect(normalizeName('  Feijão   Preto! ')).toBe('feijao preto');
  });
});

import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export interface BarcodeLookupResult {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantityText: string | null;
  imageUrl: string | null;
}

@Injectable()
export class OpenFoodFactsService {
  async lookup(ean: string): Promise<BarcodeLookupResult> {
    if (!/^\d{8,14}$/.test(ean)) throw new NotFoundException('Código de barras inválido');

    const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,brands,quantity,image_url`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'DespensaInteligente/0.1 (contato@despensa.app)' },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException('Não foi possível consultar o Open Food Facts agora');
    }

    if (!res.ok) throw new NotFoundException('Produto não encontrado');
    const json = (await res.json()) as {
      status?: number;
      product?: { product_name?: string; brands?: string; quantity?: string; image_url?: string };
    };
    if (json.status === 0 || !json.product) throw new NotFoundException('Produto não encontrado');

    return {
      barcode: ean,
      name: json.product.product_name || null,
      brand: json.product.brands?.split(',')[0]?.trim() || null,
      quantityText: json.product.quantity || null,
      imageUrl: json.product.image_url || null,
    };
  }
}

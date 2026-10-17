import { describe, it, expect } from 'vitest';
import { toLensMaterial, toLensType, toRxOrderCreate } from '@/src/api/rxOrderMapping';

describe('Rx order create payload', () => {
  it('maps configurator wording to Foundry enums', () => {
    expect(toLensType('Single vision')).toBe('sv');
    expect(toLensType('progressive_premium')).toBe('progressive');
    expect(toLensType('Computer / office')).toBe('office');
    expect(toLensType('reading')).toBeUndefined();
    expect(toLensMaterial('1.67 high index')).toBe('1.67');
    expect(toLensMaterial('Polycarbonate')).toBe('polycarbonate');
    expect(toLensMaterial('CR-39')).toBe('CR39');
    expect(toLensMaterial('cr39')).toBe('CR39');
  });

  it('sends customerId, the configuration and the price', () => {
    const body = toRxOrderCreate({
      clientId: 'c1', productId: 'gid://shopify/Product/1', productName: 'Marais Crimson', variantId: 'gid://shopify/ProductVariant/9',
      prescriptionId: '3f2c1a9e-1111-4222-8333-444455556666', notes: '  Match segment height ',
      cart: {
        attributes: [{ key: '_lensType', value: 'progressive' }, { key: '_lensIndex', value: '1.60' }, { key: '_coatings', value: 'anti-glare, blue light' }],
        addonLines: [], pricingLines: [{ code: 'lens', label: 'Progressive', amount: 30000 }],
      } as never,
      price: { basePrice: 25000, addons: 30000, total: 55000, pricingLines: [{ code: 'lens', label: 'Progressive', amount: 30000 }] } as never,
    });
    expect(body).toMatchObject({
      customerId: 'c1', prescriptionId: '3f2c1a9e-1111-4222-8333-444455556666', lensType: 'progressive', lensMaterial: '1.60',
      lensTreatments: ['anti-glare', 'blue light'], totalCents: 55000, quoteTotalCents: 55000, labNotes: 'Match segment height',
    });
    expect(body.lensSpec).toMatchObject({ productName: 'Marais Crimson', shopifyVariantId: 'gid://shopify/ProductVariant/9', attributes: { _lensIndex: '1.60' } });
    expect(body).not.toHaveProperty('clientId');
  });

  it('drops a non-uuid prescription id', () => {
    const body = toRxOrderCreate({ clientId: 'c', productId: 'p', productName: 'x', prescriptionId: 'local-1', cart: { attributes: [], addonLines: [], pricingLines: [] } as never, price: { basePrice: 0, addons: 0, total: 0, pricingLines: [] } as never });
    expect(body.prescriptionId).toBeUndefined();
  });
});

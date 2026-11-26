import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/features/tenant/baseUrl', () => ({ resolveBaseUrl: () => 'https://lunettiq.bentspline.com' }));

import { sizedImage, servedWidth } from '@/src/ui/imageUrl';

describe('sizedImage', () => {
  it('sends Shopify photos through Foundry’s resizer at a served width', () => {
    expect(sizedImage('https://cdn.shopify.com/s/files/1/x/HILTON.jpg?v=17', 240)).toBe(
      'https://lunettiq.bentspline.com/_next/image?url=https%3A%2F%2Fcdn.shopify.com%2Fs%2Ffiles%2F1%2Fx%2FHILTON.jpg%3Fv%3D17&w=256&q=75',
    );
  });
  it('drops Shopify’s own width and keeps the version', () => {
    expect(sizedImage('https://cdn.shopify.com/a.jpg?width=2000&v=1', 1600, 'https://x.test/')).toBe(
      'https://x.test/_next/image?url=https%3A%2F%2Fcdn.shopify.com%2Fa.jpg%3Fv%3D1&w=1920&q=75',
    );
  });
  it('leaves Foundry-hosted and local photos alone', () => {
    const blob = 'https://x.public.blob.vercel-storage.com/lunettiq/a.jpg';
    expect(sizedImage(blob, 240)).toBe(blob);
    expect(sizedImage('file:///tmp/photo.jpg', 240)).toBe('file:///tmp/photo.jpg');
    expect(sizedImage(null, 240)).toBe('');
  });
  it('rounds up to a width the resizer serves', () => {
    expect(servedWidth(76)).toBe(96);
    expect(servedWidth(5000)).toBe(1920);
  });
});

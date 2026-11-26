import { describe, it, expect } from 'vitest';
import { sizedImage } from '@/src/ui/imageUrl';

describe('sizedImage', () => {
  it('asks Shopify’s CDN for the shown width, keeping the version', () => {
    expect(sizedImage('https://cdn.shopify.com/s/files/1/x/HILTON.jpg?v=17', 240)).toBe('https://cdn.shopify.com/s/files/1/x/HILTON.jpg?v=17&width=240');
  });
  it('replaces an existing width', () => {
    expect(sizedImage('https://cdn.shopify.com/a.jpg?width=2000&v=1', 1600)).toBe('https://cdn.shopify.com/a.jpg?v=1&width=1600');
  });
  it('leaves other hosts alone', () => {
    const blob = 'https://x.public.blob.vercel-storage.com/lunettiq/a.jpg';
    expect(sizedImage(blob, 240)).toBe(blob);
  });
});

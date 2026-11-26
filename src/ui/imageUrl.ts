/**
 * A product photo at the size it's shown. Shopify's CDN resizes on request
 * (`width=`): a 76pt thumbnail no longer downloads the full photo. Other hosts
 * are returned unchanged. Pure, tested.
 */
export function sizedImage(url: string, width: number): string {
  if (!/^https:\/\/cdn\.shopify\.com\//.test(url)) return url;
  const px = Math.round(width);
  const [base, query = ''] = url.split('?');
  const params = query.split('&').filter((p) => p && !/^width=/.test(p));
  params.push(`width=${px}`);
  return `${base}?${params.join('&')}`;
}

import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/List';
import Colors from '../../constants/Colors';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products } = useApi();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (id) products.get(id).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) return null;

  const meta = product.metafields?.custom || product.metafields || {};
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.inventoryQuantity || v.totalInventory || 0), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.columns}>
        {/* Left: Image */}
        <View style={styles.imageCol}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.hero} resizeMode="contain" />
          ) : (
            <View style={[styles.hero, { backgroundColor: Colors.cream }]} />
          )}
          {/* Variant images */}
          {variants.length > 1 && (
            <ScrollView horizontal style={styles.thumbRow} contentContainerStyle={{ gap: 8 }}>
              {variants.filter((v: any) => v.imageUrl).map((v: any) => (
                <Image key={v.shopifyVariantId} source={{ uri: v.imageUrl }} style={styles.thumb} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Right: Info */}
        <View style={styles.infoCol}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.vendor}>{product.vendor}</Text>
          <Text style={styles.price}>
            {product.priceMin && product.priceMax && product.priceMin !== product.priceMax
              ? `$${product.priceMin} – $${product.priceMax}`
              : product.priceMin ? `$${product.priceMin}` : ''}
          </Text>

          <View style={styles.stockBadge}>
            <View style={[styles.stockDot, { backgroundColor: totalStock > 0 ? Colors.success : Colors.error }]} />
            <Text style={styles.stockText}>{totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}</Text>
          </View>

          {(product.tags || []).length > 0 && (
            <View style={styles.tags}>
              {product.tags.slice(0, 6).map((t: string) => <Badge key={t} label={t} />)}
            </View>
          )}

          {/* Dimensions */}
          <SectionLabel style={{ marginTop: 20 }}>Dimensions</SectionLabel>
          <Card style={styles.specCard}>
            <SpecRow label="Frame width" value={meta.frame_width || meta.frameWidth || '—'} />
            <SpecRow label="Lens width" value={meta.lens_width || meta.lensWidth || '—'} />
            <SpecRow label="Bridge" value={meta.bridge_width || meta.bridge || '—'} />
            <SpecRow label="Temple" value={meta.temple_length || meta.temple || '—'} />
            <SpecRow label="Lens height" value={meta.lens_height || meta.lensHeight || '—'} />
          </Card>

          {/* Material & Details */}
          <SectionLabel style={{ marginTop: 16 }}>Details</SectionLabel>
          <Card style={styles.specCard}>
            <SpecRow label="Material" value={meta.material || '—'} />
            <SpecRow label="Rx compatible" value={meta.rx_compatible === 'true' || meta.rxCompatible ? 'Yes' : 'No'} />
            <SpecRow label="Type" value={product.productType || '—'} />
            {meta.acetate_source && <SpecRow label="Acetate" value={meta.acetate_source} />}
            {meta.hinge_type && <SpecRow label="Hinge" value={meta.hinge_type} />}
          </Card>

          {/* Variants table */}
          {variants.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: 16 }}>Variants</SectionLabel>
              <Card style={styles.specCard}>
                <View style={styles.variantHeader}>
                  <Text style={[styles.variantCell, { flex: 2 }]}>Colour</Text>
                  <Text style={styles.variantCell}>SKU</Text>
                  <Text style={styles.variantCell}>Stock</Text>
                  <Text style={styles.variantCell}>Price</Text>
                </View>
                {variants.map((v: any) => (
                  <View key={v.shopifyVariantId || v.title} style={styles.variantRow}>
                    <Text style={[styles.variantValue, { flex: 2 }]}>{v.title || '—'}</Text>
                    <Text style={styles.variantValue}>{v.sku || '—'}</Text>
                    <View style={styles.variantStockCell}>
                      <View style={[styles.miniDot, { backgroundColor: (v.inventoryQuantity || v.totalInventory || 0) > 0 ? Colors.success : Colors.error }]} />
                      <Text style={styles.variantValue}>{v.inventoryQuantity ?? v.totalInventory ?? 0}</Text>
                    </View>
                    <Text style={styles.variantValue}>{v.price ? `$${v.price}` : '—'}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Description */}
          {product.description && (
            <>
              <SectionLabel style={{ marginTop: 16 }}>Description</SectionLabel>
              <Text style={styles.description}>{product.description}</Text>
            </>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Add to Session" onPress={() => router.back()} />
        <Button title="Tried On" onPress={() => {}} variant="outline" />
        <Button title="Client Likes" onPress={() => {}} variant="outline" />
        <Button title="Not a Match" onPress={() => {}} variant="outline" />
      </View>
    </ScrollView>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  columns: { flexDirection: 'row', gap: 24 },
  imageCol: { width: '40%' },
  hero: { width: '100%', aspectRatio: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  thumbRow: { marginTop: 10 },
  thumb: { width: 60, height: 60, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  infoCol: { flex: 1 },
  title: { fontSize: 22, fontWeight: '600', color: Colors.navy },
  vendor: { fontSize: 14, color: Colors.muted, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '600', color: Colors.navy, marginTop: 8 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, color: Colors.navy },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  specCard: { padding: 12 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  specLabel: { fontSize: 12, color: Colors.muted },
  specValue: { fontSize: 12, fontWeight: '600', color: Colors.navy },
  variantHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  variantCell: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  variantRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  variantValue: { flex: 1, fontSize: 12, color: Colors.navy },
  variantStockCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniDot: { width: 5, height: 5, borderRadius: 3 },
  description: { fontSize: 13, color: Colors.muted, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
});

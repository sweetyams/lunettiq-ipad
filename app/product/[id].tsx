import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Product } from '../../lib/types';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products } = useApi();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (id) products.get(id).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) return null;

  const mainImage = product.imageUrl || product.images?.[0]?.src || product.images?.[0];
  const variant = product.variants?.[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {mainImage && <Image source={{ uri: mainImage }} style={[styles.hero, { height: width > 800 ? 400 : 300 }]} resizeMode="contain" />}

      <View style={styles.header}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.vendor}>{product.vendor}</Text>
        {variant && <Text style={styles.price}>${variant.price}</Text>}
        <View style={styles.tags}>
          {(product.tags || []).slice(0, 4).map((t: string) => <Badge key={t} label={t} />)}
        </View>
      </View>

      {/* Variants */}
      {(product.variants || []).length > 1 && (
        <Section title="Variants">
          {(product.variants || []).map((v: any, i: number) => (
            <View key={v.id}>
              {i > 0 && <Separator />}
              <Row
                title={v.title}
                subtitle={v.sku || undefined}
                detail={v.inventoryQuantity !== undefined ? `${v.inventoryQuantity} in stock` : undefined}
                accessory="none"
              />
            </View>
          ))}
        </Section>
      )}

      {/* Details */}
      <Section title="Details">
        <Row title="Type" detail={product.productType || '—'} accessory="none" />
        <Separator />
        <Row title="Handle" detail={product.handle} accessory="none" />
        {variant?.sku && <View key="sku"><Separator /><Row title="SKU" detail={variant.sku} accessory="none" /></View>}
        {variant?.inventoryQuantity !== undefined && (
          <View key="stock"><Separator /><Row title="Stock (this location)" detail={`${variant.inventoryQuantity}`} accessory="none" /></View>
        )}
      </Section>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Try in Fitting" onPress={() => router.back()} />
        <Button title="Recommend to Client" onPress={() => {}} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  hero: { width: '100%', backgroundColor: Colors.white },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.black },
  vendor: { fontSize: 17, color: Colors.muted, marginTop: 2 },
  price: { fontSize: 22, fontWeight: '600', color: Colors.black, marginTop: 8 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actions: { gap: 10, paddingHorizontal: 20, marginTop: 8 },
});

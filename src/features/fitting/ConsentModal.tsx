import { View, Text } from 'react-native';
import { ChoiceChips, Sheet } from '@/src/ui/kit';
import { t as translate, useLangStore, type Lang } from '@/src/i18n';

interface ConsentModalProps {
  isVisible: boolean;
  clientName: string;
  onConsent: (granted: boolean) => void;
}

/** Asked before the first fitting photo. Closing it means no photos. */
export function ConsentModal({ isVisible, clientName, onConsent }: ConsentModalProps) {
  const first = clientName.split(' ')[0] || 'the client';
  // Staff read the sheet; the quoted script is in the client's language.
  const uiLang = useLangStore((s) => s.uiLang);
  const clientLang = useLangStore((s) => s.clientLang);
  const setClientLang = useLangStore((s) => s.setClientLang);
  const ui = (k: Parameters<typeof translate>[1], v?: Record<string, string>) => translate(uiLang, k, v);
  return (
    <Sheet
      visible={isVisible}
      onClose={() => onConsent(false)}
      title={ui('consent.title')}
      subtitle={ui('consent.ask', { name: first })}
      secondary={{ label: ui('consent.no'), onPress: () => onConsent(false) }}
      primary={{ label: ui('consent.yes', { name: first }), onPress: () => onConsent(true) }}
    >
      <View className="gap-[12px]">
        <ChoiceChips options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]} value={clientLang} onChange={(l: Lang | null) => l && setClientLang(l)} />
        <Text className="text-body-lg text-text-primary">{translate(clientLang, 'consent.script')}</Text>
        <Text className="text-body-sm text-text-tertiary">{ui('consent.small')}</Text>
      </View>
    </Sheet>
  );
}

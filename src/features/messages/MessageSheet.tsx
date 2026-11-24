/**
 * Compose a client message from a preloaded template: pick the template and
 * language, edit the text, then open it in the iPad's Messages or Mail with
 * everything filled in. Staff press send there; nothing goes out from here.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { MessageSquare, Mail } from 'lucide-react-native';
import { Button, ChoiceChips, Field, Sheet, TextField } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { mailUrl, renderTemplate, smsUrl, templateLabel, type MessageChannel, type MessageLang, type MessageVars, type TemplateKey } from './templates';

export interface MessageRecipient {
  firstName?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Client's language when known; drives the default template language. */
  language?: MessageLang | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  recipient: MessageRecipient;
  /** Templates offered, first is preselected. */
  templates: TemplateKey[];
  vars?: Omit<MessageVars, 'firstName' | 'staffName'>;
  title?: string;
  /** Called after the message was handed to Messages / Mail (log the contact here). */
  onOpened?: (info: { template: TemplateKey; channel: MessageChannel; body: string }) => void;
}

export function MessageSheet({ visible, onClose, recipient, templates, vars, title, onOpened }: Props) {
  const ui = useLangStore((s) => s.uiLang);
  const fr = ui === 'fr';
  const operator = useOperatorStore((s) => s.activeOperator);
  const [template, setTemplate] = useState<TemplateKey>(templates[0]!);
  const [lang, setLang] = useState<MessageLang>(recipient.language ?? ui);
  const canSms = !!smsUrl(recipient.phone, 'x');
  const canMail = !!mailUrl(recipient.email, 'x', 'x');
  const [channel, setChannel] = useState<MessageChannel>(canSms ? 'sms' : 'email');
  const rendered = useMemo(
    () => renderTemplate(template, lang, { ...vars, firstName: recipient.firstName, staffName: operator?.name?.split(' ')[0] ?? null }),
    [template, lang, vars, recipient.firstName, operator],
  );
  const [body, setBody] = useState(rendered.body);
  // A new template or language replaces the text (edits are per template).
  useEffect(() => setBody(rendered.body), [rendered.body]);

  const open = async () => {
    const url = channel === 'sms' ? smsUrl(recipient.phone, body) : mailUrl(recipient.email, rendered.subject, body);
    if (!url) return;
    try {
      await Linking.openURL(url);
      onOpened?.({ template, channel, body });
      onClose();
    } catch {
      toast.error(fr ? 'Impossible d’ouvrir l’app' : 'Couldn’t open the app', channel === 'sms' ? 'Messages' : 'Mail');
    }
  };

  const noContact = !canSms && !canMail;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={title ?? (fr ? 'Message au client' : 'Message the client')}
      subtitle={fr ? 'Le texte s’ouvre dans Messages ou Mail; vous l’envoyez de là.' : 'Opens in Messages or Mail with the text filled in; you send it from there.'}
      footerNote={noContact ? (fr ? 'Aucun téléphone ni courriel au dossier.' : 'No phone or email on file.') : undefined}
      secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{
        label: channel === 'sms' ? (fr ? 'Ouvrir dans Messages' : 'Open in Messages') : (fr ? 'Ouvrir dans Mail' : 'Open in Mail'),
        onPress: open,
        disabled: noContact || !body.trim(),
      }}
    >
      <View className="gap-[20px]">
        {templates.length > 1 ? (
          <Field label={fr ? 'Modèle' : 'Template'}>
            <ChoiceChips options={templates.map((k) => ({ key: k, label: templateLabel(k, ui) }))} value={template} onChange={(k: TemplateKey | null) => k && setTemplate(k)} />
          </Field>
        ) : null}
        <View className="flex-row flex-wrap items-end gap-[16px]">
          <Field label={fr ? 'Envoyer par' : 'Send by'}>
            <View className="flex-row gap-[8px]">
              <Button label="SMS" icon={MessageSquare} size="sm" variant={channel === 'sms' ? 'primary' : 'secondary'} disabled={!canSms} onPress={() => setChannel('sms')} />
              <Button label={fr ? 'Courriel' : 'Email'} icon={Mail} size="sm" variant={channel === 'email' ? 'primary' : 'secondary'} disabled={!canMail} onPress={() => setChannel('email')} />
            </View>
          </Field>
          <Field label={fr ? 'Langue' : 'Language'}>
            <ChoiceChips options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]} value={lang} onChange={(l: MessageLang | null) => l && setLang(l)} />
          </Field>
        </View>
        {channel === 'email' ? <Text className="text-body-sm text-text-tertiary">{`${fr ? 'Objet' : 'Subject'}: ${rendered.subject}`}</Text> : null}
        <TextField label={fr ? 'Message' : 'Message'} value={body} onChangeText={setBody} multiline />
      </View>
    </Sheet>
  );
}

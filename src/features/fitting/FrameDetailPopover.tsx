import { View, Text, Switch, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { Sheet, Field, TextField, ChoiceChips, VerdictPicker, Badge, kitColors, type BadgeTone } from '@/src/ui/kit';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import type { SessionPhoto } from './fitting.types';

interface FrameDetailPopoverProps {
  photo: SessionPhoto;
  visible: boolean;
  onClose: () => void;
  onUpdatePhoto: (id: string, updates: Partial<SessionPhoto>) => void;
  onDelete: (id: string) => void;
}

const UPLOAD: Record<SessionPhoto['uploadStatus'], { tone: BadgeTone; label: string }> = {
  pending: { tone: 'neutral', label: 'Waiting to upload' },
  uploading: { tone: 'info', label: 'Uploading' },
  uploaded: { tone: 'success', label: 'Uploaded' },
  failed: { tone: 'danger', label: 'Upload failed' },
};

/** Photo detail: which frame it shows, the reaction, notes, client visibility. */
export function FrameDetailPopover({ photo, visible, onClose, onUpdatePhoto, onDelete }: FrameDetailPopoverProps) {
  const framesTried = useSessionStore((s) => s.framesTried);
  const [notes, setNotes] = useState(photo.notes);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setNotes(photo.notes), [photo.notes]);
  // Save notes after a pause in typing.
  useEffect(() => {
    if (notes === photo.notes) return;
    const t = setTimeout(() => onUpdatePhoto(photo.id, { notes }), 800);
    return () => clearTimeout(t);
  }, [notes, photo.notes, photo.id, onUpdatePhoto]);

  const frameOptions = [...new Map(framesTried.map((f) => [f.productId, { key: f.productId, label: f.productName }])).values()];
  const linkFrame = (productId: string | null) => {
    const f = framesTried.find((x) => x.productId === productId);
    onUpdatePhoto(photo.id, { productId: f?.productId ?? null, productName: f?.productName ?? null });
  };
  const upload = UPLOAD[photo.uploadStatus];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={photo.productName ?? 'Fitting photo'}
      subtitle={new Date(photo.capturedAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
      danger={{ label: confirmDelete ? 'Tap again to delete' : 'Delete photo', onPress: () => (confirmDelete ? (onDelete(photo.id), onClose()) : setConfirmDelete(true)) }}
      secondary={{ label: 'Close', onPress: onClose }}
      footer={undefined}
      primary={{ label: 'Done', onPress: onClose }}
    >
      <View className="flex-row gap-[24px]">
        <View className="flex-1 border border-border rounded-lg overflow-hidden" style={{ aspectRatio: 3 / 4, maxHeight: 520 }}>
          <ScrollView maximumZoomScale={3} minimumZoomScale={1} contentContainerStyle={{ flex: 1 }}>
            <Image source={{ uri: photo.localUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} accessibilityLabel={`Photo of ${photo.productName ?? 'a frame'}`} />
          </ScrollView>
        </View>
        <View className="flex-1 gap-[20px]">
          <Field label="Frame in the photo" hint={frameOptions.length ? undefined : 'Add frames to the visit tray first, then link them here.'}>
            {frameOptions.length ? <ChoiceChips options={frameOptions} value={photo.productId} onChange={linkFrame} /> : null}
          </Field>
          <Field label="Reaction">
            <VerdictPicker value={photo.verdict} onChange={(v) => onUpdatePhoto(photo.id, { verdict: v ?? null })} label={photo.productName ?? 'photo'} />
          </Field>
          <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. Sits low on the nose; try a smaller bridge" multiline />
          <View className="flex-row items-center justify-between gap-[16px] border border-border rounded-md px-[16px] min-h-[56px]">
            <View className="flex-1">
              <Text className="text-body-md text-text-primary">Show to the client</Text>
              <Text className="text-body-sm text-text-tertiary">In handed mode and the follow-up email.</Text>
            </View>
            <Switch value={photo.clientVisible} onValueChange={(v) => onUpdatePhoto(photo.id, { clientVisible: v })} trackColor={{ true: kitColors.primary, false: kitColors.border }} accessibilityLabel="Show to the client" />
          </View>
          <View className="flex-row"><Badge tone={upload.tone} dot={upload.tone !== 'neutral'}>{upload.label}</Badge></View>
        </View>
      </View>
    </Sheet>
  );
}

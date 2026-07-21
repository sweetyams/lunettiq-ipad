import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  TextInput, 
  Alert, 
  ScrollView, 
  Image,
  Vibration,
} from 'react-native';
import { useState, useEffect } from 'react';
import { X, Link, Star, Trash2, BarChart3 } from 'lucide-react-native';
import { VerdictControl } from './VerdictControl';
import { Button } from '@/src/ui/Button';
import { toast } from '@/src/ui/useToastStore';
import type { SessionPhoto, Verdict } from './fitting.types';

interface FrameDetailPopoverProps {
  photo: SessionPhoto;
  visible: boolean;
  onClose: () => void;
  onUpdatePhoto: (id: string, updates: Partial<SessionPhoto>) => void;
  onDelete: (id: string) => void;
  onShortlist: (id: string) => void;
  onRelink: (id: string) => void;
}

export function FrameDetailPopover({
  photo,
  visible,
  onClose,
  onUpdatePhoto,
  onDelete,
  onShortlist,
  onRelink,
}: FrameDetailPopoverProps) {
  const [notes, setNotes] = useState(photo.notes);
  const [isShortlisted, setIsShortlisted] = useState(false); // TODO: Get from actual shortlist state

  // Sync local notes state with photo prop
  useEffect(() => {
    setNotes(photo.notes);
  }, [photo.notes]);

  // Auto-save notes after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== photo.notes) {
        onUpdatePhoto(photo.id, { notes });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, photo.notes, photo.id, onUpdatePhoto]);

  const handleVerdictChange = (verdict: Verdict) => {
    // Haptic feedback for verdict selection
    try {
      Vibration.vibrate(50);
    } catch (error) {
      // Vibration not supported, continue silently
    }
    
    onUpdatePhoto(photo.id, { verdict });
  };

  const handleShortlist = () => {
    const now = new Date();
    const holdUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    const formattedDate = holdUntil.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    onShortlist(photo.id);
    setIsShortlisted(true);
    
    // Show confirmation toast
    toast.success('Added to Shortlist', `Held until ${formattedDate}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(photo.id);
            onClose();
          }
        }
      ]
    );
  };

  // Format the upload status for display
  const getUploadStatusText = () => {
    switch (photo.uploadStatus) {
      case 'pending': return 'Queued for upload';
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'failed': return 'Upload failed';
      default: return '';
    }
  };

  const getUploadStatusColor = () => {
    switch (photo.uploadStatus) {
      case 'pending': return '#D4A017';
      case 'uploading': return '#2D4A8A';
      case 'uploaded': return '#005D23';
      case 'failed': return '#C53030';
      default: return '#6B6B6B';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg-page">
        {/* Header */}
        <View className="flex-row items-center justify-between px-lg py-md bg-bg-elevated border-b border-border">
          <Text className="text-headline font-semibold text-text-primary">
            Photo Detail
          </Text>
          <Pressable
            onPress={onClose}
            className="w-11 h-11 items-center justify-center rounded-full bg-border/30"
            accessibilityRole="button"
            accessibilityLabel="Close photo detail"
          >
            <X size={20} color="#2B2B2B" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Large Photo */}
          <View className="bg-bg-elevated mx-lg mt-lg rounded-lg border border-border overflow-hidden">
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              className="w-full"
              style={{ height: 400 }}
            >
              {photo.localUri.startsWith('mock://') ? (
                // Mock photo placeholder
                <View className="w-full h-full bg-gray-200 items-center justify-center">
                  <BarChart3 size={48} color="#6B6B6B" />
                  <Text className="text-text-muted text-body mt-sm">
                    Photo {photo.localUri.split('_')[1]}
                  </Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: photo.localUri }} 
                  className="w-full h-full"
                  resizeMode="contain"
                />
              )}
            </ScrollView>
            
            {/* Upload Status Indicator */}
            <View className="absolute top-2 right-2 bg-black/70 px-sm py-xs rounded-md">
              <Text 
                className="text-caption text-text-inverse"
                style={{ color: getUploadStatusColor() }}
              >
                {getUploadStatusText()}
              </Text>
            </View>
          </View>

          {/* Product Link Section */}
          <View className="bg-bg-elevated mx-lg mt-lg rounded-lg border border-border p-md">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-captionStrong text-text-muted mb-xs">PRODUCT</Text>
                {photo.productName ? (
                  <Text className="text-body text-text-primary">{photo.productName}</Text>
                ) : (
                  <Text className="text-body text-text-muted italic">Not linked</Text>
                )}
              </View>
              <Pressable
                onPress={() => onRelink(photo.id)}
                className="flex-row items-center bg-brand px-md py-sm rounded-md min-h-[44px]"
                accessibilityRole="button"
                accessibilityLabel={photo.productName ? "Re-link product" : "Link product"}
              >
                <Link size={16} color="white" />
                <Text className="text-bodyStrong text-text-inverse ml-sm">
                  {photo.productName ? 'Re-link' : 'Link Product'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Notes Section */}
          <View className="bg-bg-elevated mx-lg mt-lg rounded-lg border border-border p-md">
            <Text className="text-captionStrong text-text-muted mb-sm">NOTES</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              multiline
              numberOfLines={4}
              className="text-body text-text-primary border border-border rounded-md p-sm min-h-[100px]"
              style={{ textAlignVertical: 'top' }}
              accessibilityLabel="Photo notes"
            />
          </View>

          {/* Verdict Section */}
          <View className="bg-bg-elevated mx-lg mt-lg rounded-lg border border-border p-md">
            <Text className="text-captionStrong text-text-muted mb-sm">CLIENT'S VERDICT</Text>
            <VerdictControl
              value={photo.verdict}
              onChange={handleVerdictChange}
              size="medium"
            />
          </View>

          {/* Actions Section */}
          <View className="mx-lg mt-lg mb-lg space-y-md">
            {/* Shortlist Button */}
            <Button
              variant={isShortlisted ? "ghost" : "secondary"}
              onPress={handleShortlist}
              disabled={isShortlisted}
              className="flex-row items-center justify-center"
            >
              <Star 
                size={16} 
                color={isShortlisted ? "#005D23" : "white"} 
                fill={isShortlisted ? "#005D23" : "none"}
              />
              <Text className={`ml-sm ${isShortlisted ? 'text-accent' : 'text-text-inverse'}`}>
                {isShortlisted ? 'Added to Shortlist' : 'Add to Shortlist'}
              </Text>
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              onPress={handleDelete}
              className="flex-row items-center justify-center border border-error"
            >
              <Trash2 size={16} color="#C53030" />
              <Text className="text-error ml-sm">Delete Photo</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
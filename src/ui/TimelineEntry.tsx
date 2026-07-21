import React from 'react';
import { View, Text } from 'react-native';
import { MessageSquare, Phone, MapPin, Mail, User, Eye } from 'lucide-react-native';
import { usePrivacyStore } from '../features/privacy/PrivacyModeProvider';
import type { Interaction } from '../api/interactions.types';

interface TimelineEntryProps {
  interaction: Interaction;
}

function getInteractionIcon(type: string) {
  switch (type) {
    case 'note':
      return MessageSquare;
    case 'call':
      return Phone;
    case 'visit':
      return MapPin;
    case 'email':
      return Mail;
    case 'session':
      return User;
    case 'privacy_mode_change':
      return Eye;
    default:
      return MessageSquare;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TimelineEntry({ interaction }: TimelineEntryProps) {
  const privacyMode = usePrivacyStore((state) => state.mode);
  
  // Hide internal notes in client mode
  const isInternalNote = interaction.type.includes('internal') || interaction.direction === 'internal';
  if (privacyMode === 'client' && isInternalNote) {
    return null;
  }

  const IconComponent = getInteractionIcon(interaction.type);

  return (
    <View className="flex-row items-start p-md border-b border-border bg-bg-elevated">
      {/* Icon */}
      <View className="mr-sm mt-xs">
        <IconComponent size={20} color="#6B6B6B" />
      </View>

      {/* Content */}
      <View className="flex-1 mr-sm">
        {interaction.subject && (
          <Text className="text-[17px] font-medium text-text-primary mb-xs">
            {interaction.subject}
          </Text>
        )}
        {interaction.body && (
          <Text className="text-[17px] text-text-primary leading-relaxed">
            {interaction.body}
          </Text>
        )}
        {!interaction.subject && !interaction.body && (
          <Text className="text-[17px] text-text-muted italic">
            {interaction.type === 'session' ? 'Consultation session' : 'No details'}
          </Text>
        )}
      </View>

      {/* Date */}
      <Text className="text-[14px] text-text-muted mt-xs">
        {formatDate(interaction.occurredAt)}
      </Text>
    </View>
  );
}
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Card, CardHead, CardBody, CardFoot, RowKV, Tag, Button } from '@/src/ui';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { useClientEnrichment } from '@/src/api/useClients';
import type { Prescription } from '@/src/api/prescriptions.types';

interface ClinicalTabProps {
  clientId: string;
  onAddPrescription: () => void;
  onEditFit: () => void;
  onAddClinicalNote: () => void;
}

export function ClinicalTab({ clientId, onAddPrescription, onEditFit, onAddClinicalNote }: ClinicalTabProps) {
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = usePrescriptions({ clientId });
  const { data: enrichment, isLoading: enrichmentLoading } = useClientEnrichment(clientId);

  const handleLiDARCapture = () => {
    Alert.alert('LiDAR Capture', 'LiDAR measurement capture coming soon!');
  };

  // Calculate sizing guidance from fit profile
  const getSizingGuidance = () => {
    if (!enrichment?.frameWidthMm || !enrichment?.bridgeWidthMm) {
      return null;
    }
    
    const frameMin = Math.max(47, enrichment.frameWidthMm - 3);
    const frameMax = Math.min(55, enrichment.frameWidthMm + 3);
    const bridgeMin = Math.max(16, enrichment.bridgeWidthMm - 2);
    const bridgeMax = Math.min(24, enrichment.bridgeWidthMm + 2);
    
    return `${frameMin}–${frameMax} □ ${bridgeMin}–${bridgeMax}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const RxTable = ({ prescription }: { prescription: Prescription }) => {
    const hasOd = prescription.sphereOd != null || prescription.cylinderOd != null;
    const hasOs = prescription.sphereOs != null || prescription.cylinderOs != null;
    if (!hasOd && !hasOs) return null;

    const fmt = (v?: number) => (v != null ? String(v) : '—');

    return (
      <View className="mt-sm">
        {/* Header row */}
        <View className="flex-row pb-xs border-b border-border">
          <Text className="text-caption-sm font-mono text-text-muted w-[32px]" />
          <Text className="text-caption-sm font-mono text-text-muted w-[56px] text-center">SPH</Text>
          <Text className="text-caption-sm font-mono text-text-muted w-[56px] text-center">CYL</Text>
          <Text className="text-caption-sm font-mono text-text-muted w-[56px] text-center">Axis</Text>
          <Text className="text-caption-sm font-mono text-text-muted w-[56px] text-center">Add</Text>
          <Text className="text-caption-sm font-mono text-text-muted w-[56px] text-center">PD</Text>
        </View>

        {/* OD row */}
        {hasOd && (
          <View className="flex-row py-xs">
            <Text className="text-caption-sm font-mono text-text-secondary w-[32px]">OD</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.sphereOd)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.cylinderOd)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.axisOd)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.addOd)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.pdRight)}</Text>
          </View>
        )}

        {/* OS row */}
        {hasOs && (
          <View className="flex-row py-xs">
            <Text className="text-caption-sm font-mono text-text-secondary w-[32px]">OS</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.sphereOs)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.cylinderOs)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.axisOs)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.addOs)}</Text>
            <Text className="text-caption-sm font-mono text-text-primary w-[56px] text-center">{fmt(prescription.pdLeft)}</Text>
          </View>
        )}
      </View>
    );
  };

  const PrescriptionEntry = ({ prescription }: { prescription: Prescription }) => (
    <View className="p-md border-b border-border">
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-xs">
        <Text className="text-body-md font-medium text-text-primary">
          {prescription.type} · {prescription.prescribedBy || 'Unknown prescriber'}
        </Text>
        <Tag
          label={prescription.verified ? 'Verified' : 'Unverified'}
          variant={prescription.verified ? 'ok' : 'warn'}
        />
      </View>

      {/* Sub-line */}
      <Text className="text-caption-sm text-text-muted mb-sm">
        {prescription.prescribedAt ? `Exam ${formatDate(prescription.prescribedAt)}` : ''}
        {prescription.expiresAt ? ` · expires ${formatDate(prescription.expiresAt)}` : ''}
      </Text>

      {/* Rx table */}
      <RxTable prescription={prescription} />
    </View>
  );

  return (
    <View className="flex-row gap-lg">
      {/* Left column */}
      <View className="flex-1">
        {/* Prescriptions card */}
        <Card className="mb-lg">
              <CardHead>
                <Text className="text-heading-xs font-medium">Prescriptions</Text>
                <Pressable onPress={onAddPrescription}>
                  <Text className="text-body-sm font-medium text-color-brand">+ Add prescription</Text>
                </Pressable>
              </CardHead>
              <CardBody noPadding>
                {prescriptionsLoading ? (
                  <View className="p-md">
                    <Text className="text-color-text-muted text-body-md">Loading prescriptions...</Text>
                  </View>
                ) : prescriptions.length === 0 ? (
                  <View className="p-md">
                    <Text className="text-color-text-muted text-body-md">No prescriptions on file</Text>
                  </View>
                ) : (
                  prescriptions.map((prescription) => (
                    <PrescriptionEntry key={prescription.id} prescription={prescription} />
                  ))
                )}
              </CardBody>
            </Card>

            {/* Clinical notes card */}
            <Card>
              <CardHead>
                <Text className="text-heading-xs font-medium">Clinical notes (staff only)</Text>
                <Pressable onPress={onAddClinicalNote}>
                  <Text className="text-body-sm font-medium text-color-brand">Add</Text>
                </Pressable>
              </CardHead>
              <CardBody>
                <Text className="text-color-text-muted text-body-md italic">
                  No clinical notes yet
                </Text>
              </CardBody>
            </Card>
          </View>

          {/* Right column */}
          <View className="flex-1">
            {/* Fit profile card */}
            <Card className="mb-lg">
              <CardHead>
                <Text className="text-heading-xs font-medium">Fit profile</Text>
                <Pressable onPress={onEditFit}>
                  <Text className="text-body-sm font-medium text-color-brand">Edit</Text>
                </Pressable>
              </CardHead>
              <CardBody>
                {enrichmentLoading ? (
                  <Text className="text-color-text-muted text-body-md">Loading fit profile...</Text>
                ) : enrichment ? (
                  <View className="gap-sm">
                    <RowKV 
                      label="Face shape" 
                      value={enrichment.faceShape || 'Not measured'} 
                    />
                    <RowKV 
                      label="Frame width (mm)" 
                      value={enrichment.frameWidthMm ? `${enrichment.frameWidthMm}mm` : 'Not measured'} 
                    />
                    <RowKV 
                      label="Bridge width (mm)" 
                      value={enrichment.bridgeWidthMm ? `${enrichment.bridgeWidthMm}mm` : 'Not measured'} 
                    />
                  </View>
                ) : (
                  <Text className="text-color-text-muted text-body-md">No measurements yet</Text>
                )}
              </CardBody>
              <CardFoot>
                <Button variant="ghost" block onPress={handleLiDARCapture}>
                  Capture with LiDAR
                </Button>
              </CardFoot>
            </Card>

            {/* Sizing guidance card */}
            <Card>
              <CardHead>
                <Text className="text-heading-xs font-medium">Sizing guidance</Text>
              </CardHead>
              <CardBody>
                {getSizingGuidance() ? (
                  <>
                    <Text className="text-display-sm font-mono text-color-text-primary text-center mb-md">
                      {getSizingGuidance()}
                    </Text>
                    <Text className="text-body-md text-color-text-secondary">
                      Based on fit profile measurements. Frame width and bridge width ranges that should work well for this client.
                    </Text>
                  </>
                ) : (
                  <Text className="text-color-text-muted text-body-md italic">
                    Complete fit profile to see sizing guidance
                  </Text>
                )}
              </CardBody>
            </Card>
          </View>
        </View>
  );
}
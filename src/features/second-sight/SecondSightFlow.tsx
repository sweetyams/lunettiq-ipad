import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  X, 
  Camera as CameraIcon,
  CheckCircle2,
  Star,
  DollarSign
} from 'lucide-react-native';

import { useSecondSightStore } from './useSecondSightStore';
import { useCreateSecondSight, useUpdateSecondSight, useIssueSecondSightCredit } from '../../api/useSecondSight';
import { 
  PHOTO_SLOTS, 
  CONDITION_OPTIONS, 
  GRADE_DESCRIPTIONS, 
  GRADE_CREDIT_MAP,
  FrameGrade 
} from './second-sight.types';

interface SecondSightFlowProps {
  clientId: string;
  clientName: string;
  clientTier: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface CaptureViewProps {
  isVisible: boolean;
  onCapture: (photo: { uri: string }) => void;
  onClose: () => void;
}

function CaptureView({ isVisible, onCapture, onClose }: CaptureViewProps) {
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!isVisible) return null;

  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-bg-inverse justify-center items-center">
        <Text className="text-text-inverse text-body mb-lg">Camera access needed for Second Sight</Text>
        <Pressable 
          onPress={requestPermission}
          className="bg-accent rounded-md px-lg py-sm"
        >
          <Text className="text-text-inverse text-bodyStrong">Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (camera) {
      try {
        const photo = await camera.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        onCapture(photo);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  return (
    <View className="flex-1 bg-bg-inverse">
      <View className="absolute top-12 left-4 z-10">
        <Pressable 
          onPress={onClose}
          className="bg-bg-inverse/50 rounded-full p-2"
        >
          <X size={24} color="white" />
        </Pressable>
      </View>
      
      <CameraView
        ref={setCamera}
        style={{ flex: 1 }}
        facing="back"
      />
      
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <Pressable 
          onPress={takePicture}
          className="w-18 h-18 bg-bg-elevated rounded-full border-4 border-border justify-center items-center"
        >
          <CameraIcon size={32} color="#0A153D" />
        </Pressable>
      </View>
    </View>
  );
}

export function SecondSightFlow({ 
  clientId, 
  clientName, 
  clientTier, 
  onComplete, 
  onCancel 
}: SecondSightFlowProps) {
  const router = useRouter();
  const {
    currentStep,
    intake,
    nextStep,
    prevStep,
    setFrameDescription,
    setBrand,
    setModel,
    setCondition,
    addPhoto,
    removePhoto,
    getPhotoForSlot,
    setGrade,
    calculateCredit,
    setCreditAmount,
    setNotes,
    initializeIntake,
    reset,
    canProceedFromStep,
  } = useSecondSightStore();

  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoSlot, setCurrentPhotoSlot] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [creditDeclined, setCreditDeclined] = useState(false);

  const createMutation = useCreateSecondSight();
  const updateMutation = useUpdateSecondSight();
  const issueCreditMutation = useIssueSecondSightCredit();

  React.useEffect(() => {
    initializeIntake(clientId, clientName);
  }, [clientId, clientName, initializeIntake]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Second Sight',
      'Are you sure? This will discard all progress.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => {
            reset();
            onCancel?.() || router.back();
          }
        }
      ]
    );
  };

  const openCamera = (slotId: string) => {
    setCurrentPhotoSlot(slotId);
    setShowCamera(true);
  };

  const handlePhotoCapture = (photo: { uri: string }) => {
    addPhoto(photo.uri, currentPhotoSlot);
    setShowCamera(false);
    setCurrentPhotoSlot('');
  };

  const handleNext = async () => {
    if (currentStep === 2 && canProceedFromStep(2)) {
      // Submit intake after photos
      setIsProcessing(true);
      try {
        await createMutation.mutateAsync({
          clientId,
          frameDescription: intake.frameDescription || '',
          brand: intake.brand,
          model: intake.model,
          condition: intake.condition,
          photoUrls: intake.localPhotoUris || [],
          notes: intake.notes,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to save intake. Please try again.');
        return;
      } finally {
        setIsProcessing(false);
      }
    }

    if (currentStep === 4) {
      // Calculate and set credit amount
      const creditAmount = calculateCredit(clientTier);
      setCreditAmount(creditAmount);
    }

    nextStep();
  };

  const handleGradeSelection = (grade: FrameGrade) => {
    setGrade(grade);
    const creditAmount = calculateCredit(clientTier);
    setCreditAmount(creditAmount);
  };

  const handleCreditAccept = async () => {
    if (!intake.id || !intake.creditAmount) return;
    
    setIsProcessing(true);
    try {
      await issueCreditMutation.mutateAsync({
        id: intake.id,
        creditAmount: intake.creditAmount,
      });
      nextStep(); // Go to confirmation
    } catch (error) {
      Alert.alert('Error', 'Failed to issue credit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreditDecline = () => {
    setCreditDeclined(true);
    nextStep(); // Go to confirmation with declined state
  };

  const handleComplete = () => {
    reset();
    onComplete?.() || router.back();
  };

  if (showCamera) {
    return (
      <CaptureView
        isVisible={showCamera}
        onCapture={handlePhotoCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center py-lg">
      {Array.from({ length: 6 }, (_, i) => (
        <View
          key={i}
          className={`w-3 h-3 rounded-full mx-1 ${
            i + 1 <= currentStep ? 'bg-accent' : 'bg-border'
          }`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView className="flex-1 p-lg">
      <Text className="text-displayMd text-text-primary font-bold mb-md">
        Identify the Frame
      </Text>
      
      <View className="mb-lg">
        <Text className="text-bodyStrong text-text-primary mb-sm">Brand & Model</Text>
        <View className="flex-row gap-sm">
          <TextInput
            className="flex-1 bg-bg-elevated border border-border rounded-md px-md py-sm text-body"
            placeholder="Brand"
            value={intake.brand || ''}
            onChangeText={setBrand}
          />
          <TextInput
            className="flex-1 bg-bg-elevated border border-border rounded-md px-md py-sm text-body"
            placeholder="Model"
            value={intake.model || ''}
            onChangeText={setModel}
          />
        </View>
      </View>

      <View className="mb-lg">
        <Text className="text-bodyStrong text-text-primary mb-sm">Overall Condition</Text>
        {CONDITION_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setCondition(option.value)}
            className={`border rounded-md p-md mb-sm ${
              intake.condition === option.value 
                ? 'border-accent bg-accent/5' 
                : 'border-border bg-bg-elevated'
            }`}
          >
            <Text className="text-bodyStrong text-text-primary">{option.label}</Text>
            <Text className="text-body text-text-muted">{option.description}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-lg">
        <Text className="text-bodyStrong text-text-primary mb-sm">
          Can't identify it? Describe what you see
        </Text>
        <TextInput
          className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body min-h-[100px]"
          placeholder="Frame description..."
          value={intake.frameDescription || ''}
          onChangeText={setFrameDescription}
          multiline
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView className="flex-1 p-lg">
      <Text className="text-displayMd text-text-primary font-bold mb-md">
        Capture Photos
      </Text>
      <Text className="text-body text-text-muted mb-lg">
        Take 4 photos to document the frame condition
      </Text>

      <View className="grid grid-cols-2 gap-md">
        {PHOTO_SLOTS.map((slot) => {
          const photoUri = getPhotoForSlot(slot.id);
          return (
            <Pressable
              key={slot.id}
              onPress={() => openCamera(slot.id)}
              className="bg-bg-elevated border border-border rounded-lg p-md aspect-square justify-center items-center"
            >
              {photoUri ? (
                <Image 
                  source={{ uri: photoUri }} 
                  className="w-full h-full rounded-md" 
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <CameraIcon size={32} color="#6B6B6B" />
                  <Text className="text-captionStrong text-text-muted mt-sm text-center">
                    {slot.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1 p-lg">
      <Text className="text-displayMd text-text-primary font-bold mb-md">
        Grade the Frame
      </Text>
      <Text className="text-body text-text-muted mb-lg">
        Select the grade that best describes the frame condition
      </Text>

      <View className="gap-md">
        {(Object.entries(GRADE_DESCRIPTIONS) as Array<[FrameGrade, typeof GRADE_DESCRIPTIONS[FrameGrade]]>).map(([grade, info]) => (
          <Pressable
            key={grade}
            onPress={() => handleGradeSelection(grade)}
            className={`border rounded-lg p-lg ${
              intake.grade === grade 
                ? 'border-accent bg-accent/5' 
                : 'border-border bg-bg-elevated'
            }`}
          >
            <View className="flex-row justify-between items-start mb-sm">
              <View>
                <Text className="text-headline text-text-primary font-semibold">
                  Grade {grade} - {info.title}
                </Text>
                <Text className="text-body text-text-muted">{info.description}</Text>
              </View>
              <View className="bg-brand rounded-md px-md py-sm">
                <Text className="text-text-inverse text-bodyStrong">
                  ${GRADE_CREDIT_MAP[grade] / 100}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep4 = () => {
    const baseCredit = intake.grade ? GRADE_CREDIT_MAP[intake.grade] : 0;
    const tierMultiplier = clientTier === 'cult' ? 1.15 : clientTier === 'vault' ? 1.25 : 1.0;
    const finalCredit = Math.round(baseCredit * tierMultiplier);

    return (
      <ScrollView className="flex-1 p-lg">
        <Text className="text-displayMd text-text-primary font-bold mb-md">
          Credit Calculation
        </Text>

        <View className="bg-bg-elevated border border-border rounded-lg p-lg mb-lg">
          <View className="flex-row justify-between items-center mb-md">
            <Text className="text-body text-text-primary">Base Credit (Grade {intake.grade})</Text>
            <Text className="text-bodyStrong text-text-primary">${baseCredit / 100}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-md">
            <View className="flex-row items-center">
              <Text className="text-body text-text-primary">Tier Multiplier</Text>
              <View className="bg-brand rounded px-sm py-1 ml-sm">
                <Text className="text-text-inverse text-captionStrong uppercase">{clientTier}</Text>
              </View>
            </View>
            <Text className="text-bodyStrong text-text-primary">×{tierMultiplier}</Text>
          </View>
          
          <View className="border-t border-border pt-md">
            <View className="flex-row justify-between items-center">
              <Text className="text-headline text-text-primary font-semibold">Final Credit</Text>
              <Text className="text-headline text-accent font-bold">${finalCredit / 100}</Text>
            </View>
          </View>
        </View>

        <Text className="text-body text-text-muted text-center">
          Credit will be added to {clientName}'s account
        </Text>
      </ScrollView>
    );
  };

  const renderStep5 = () => (
    <View className="flex-1 justify-center p-lg">
      <Text className="text-displayMd text-text-primary font-bold text-center mb-lg">
        Client Decision
      </Text>
      
      <View className="bg-bg-elevated border border-border rounded-lg p-lg mb-xl text-center">
        <Text className="text-headline text-text-primary font-semibold mb-sm text-center">
          ${intake.creditAmount ? intake.creditAmount / 100 : 0} Store Credit
        </Text>
        <Text className="text-body text-text-muted text-center">
          Does {clientName} accept this trade-in offer?
        </Text>
      </View>

      <View className="gap-md">
        <Pressable
          onPress={handleCreditAccept}
          disabled={isProcessing}
          className="bg-accent rounded-md py-lg px-xl"
        >
          <Text className="text-text-inverse text-bodyStrong text-center">
            {isProcessing ? 'Processing...' : 'Client Accepts'}
          </Text>
        </Pressable>
        
        <Pressable
          onPress={handleCreditDecline}
          className="border border-border rounded-md py-lg px-xl"
        >
          <Text className="text-text-primary text-bodyStrong text-center">Client Declines</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View className="flex-1 justify-center items-center p-lg">
      <View className="items-center mb-xl">
        <CheckCircle2 size={64} color="#005D23" />
        <Text className="text-displayMd text-text-primary font-bold text-center mt-lg">
          {creditDeclined ? 'Trade-in Declined' : 'Credit Issued!'}
        </Text>
        
        {!creditDeclined && (
          <>
            <Text className="text-headline text-accent font-semibold mt-sm">
              ${intake.creditAmount ? intake.creditAmount / 100 : 0}
            </Text>
            <Text className="text-body text-text-muted text-center mt-sm">
              Added to {clientName}'s account
            </Text>
          </>
        )}
        
        {creditDeclined && (
          <Text className="text-body text-text-muted text-center mt-sm">
            No credit was issued for this trade-in
          </Text>
        )}
      </View>

      <Pressable
        onPress={handleComplete}
        className="bg-brand rounded-md py-lg px-xl"
      >
        <Text className="text-text-inverse text-bodyStrong">Done</Text>
      </Pressable>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="bg-bg-elevated border-b border-border px-lg py-md">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={currentStep === 1 ? handleCancel : prevStep}>
            {currentStep === 1 ? (
              <X size={24} color="#0A153D" />
            ) : (
              <ChevronLeft size={24} color="#0A153D" />
            )}
          </Pressable>
          
          <Text className="text-headline text-text-primary font-semibold">
            Second Sight - {clientName}
          </Text>
          
          <View className="w-6" />
        </View>
        
        {renderStepIndicator()}
      </View>

      {/* Content */}
      {renderCurrentStep()}

      {/* Bottom Action Bar */}
      {currentStep < 6 && currentStep !== 5 && (
        <View className="bg-bg-elevated border-t border-border p-lg">
          <Pressable
            onPress={handleNext}
            disabled={!canProceedFromStep(currentStep) || isProcessing}
            className={`rounded-md py-lg px-xl ${
              canProceedFromStep(currentStep) && !isProcessing
                ? 'bg-accent' 
                : 'bg-border'
            }`}
          >
            <Text className={`text-center text-bodyStrong ${
              canProceedFromStep(currentStep) && !isProcessing 
                ? 'text-text-inverse' 
                : 'text-text-muted'
            }`}>
              {isProcessing ? 'Processing...' : currentStep === 2 ? 'Save & Continue' : 'Next'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
import { View, Text, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Camera, Plus, X, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useCustomDesignStore } from './useCustomDesignStore';
import { useCreateCustomDesign } from '@/src/api/useCustomDesign';
import { CustomDesignIntake, BudgetRange, MaterialPreference, ReferencePhoto } from './custom-design.types';

// Lazy-load optional native modules
let ImagePicker: any = null;
try { ImagePicker = require('expo-image-picker'); } catch { /* not available */ }

interface CustomDesignFlowProps {
  clientId: string;
  clientName: string;
}

export function CustomDesignFlow({ clientId, clientName }: CustomDesignFlowProps) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const {
    currentStep,
    intake,
    isSubmitting,
    nextStep,
    prevStep,
    goToStep,
    addReferencePhoto,
    removeReferencePhoto,
    updatePhotoCaption,
    setDesignBrief,
    setModifications,
    setMaterialPreference,
    setColourPreference,
    setMeasurements,
    setBudgetRange,
    setTargetDate,
    setNotes,
    initializeIntake,
    reset,
  } = useCustomDesignStore();
  
  const createMutation = useCreateCustomDesign();
  
  // Initialize intake on mount
  useState(() => {
    initializeIntake(clientId, clientName);
  });
  
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (intake.referencePhotos?.length || 0) >= 1;
      case 2:
        return !!intake.designBrief?.trim();
      case 3:
        return true; // Measurements are optional
      case 4:
        return !!intake.budgetRange;
      case 5:
        return true;
      default:
        return false;
    }
  };
  
  const handleAddPhoto = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Photo library requires a development build.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const photo: ReferencePhoto = {
          localUri: result.assets[0].uri,
        };
        addReferencePhoto(photo);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  const handleTakePhoto = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Camera requires a development build.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const photo: ReferencePhoto = {
          localUri: result.assets[0].uri,
        };
        addReferencePhoto(photo);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };
  
  const handleSubmit = async () => {
    if (!intake.clientId || !intake.clientName) {
      Alert.alert('Error', 'Missing client information');
      return;
    }
    
    try {
      const intakeData = {
        ...intake,
        submittedAt: Date.now(),
      } as Omit<CustomDesignIntake, 'id'>;
      
      await createMutation.mutateAsync(intakeData);
      
      Alert.alert(
        'Design Submitted',
        'Quote within 48 hours',
        [
          {
            text: 'OK',
            onPress: () => {
              reset();
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting design:', error);
      Alert.alert('Error', 'Failed to submit design. Please try again.');
    }
  };
  
  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center py-lg">
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} className="flex-row items-center">
          <Pressable
            onPress={() => goToStep(step)}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${step}`}
            accessibilityState={{ selected: step === currentStep }}
            className={`w-8 h-8 rounded-full items-center justify-center ${
              step <= currentStep ? 'bg-brand' : 'bg-border'
            }`}
          >
            <Text className={`text-caption font-medium ${
              step <= currentStep ? 'text-text-inverse' : 'text-text-muted'
            }`}>
              {step}
            </Text>
          </Pressable>
          {step < 5 && (
            <View className={`w-8 h-0.5 ${
              step < currentStep ? 'bg-brand' : 'bg-border'
            }`} />
          )}
        </View>
      ))}
    </View>
  );
  
  const renderStep1 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary mb-sm">Reference Photos</Text>
      <Text className="text-body text-text-muted mb-lg">
        Add inspiration photos or examples of frames you like (minimum 1 photo)
      </Text>
      
      <View className="flex-row flex-wrap gap-md mb-lg">
        {intake.referencePhotos?.map((photo, index) => (
          <View key={index} className="relative">
            <Image
              source={{ uri: photo.localUri }}
              className="w-24 h-24 rounded-md"
            />
            <Pressable
              onPress={() => removeReferencePhoto(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove reference photo ${index + 1}`}
              className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full items-center justify-center"
            >
              <X size={14} color="white" />
            </Pressable>
            <TextInput
              placeholder="What do you like about this?"
              value={photo.caption || ''}
              onChangeText={(text) => updatePhotoCaption(index, text)}
              className="mt-sm p-sm bg-bg-elevated rounded-md border border-border text-body"
              multiline
            />
          </View>
        ))}
        
        {(intake.referencePhotos?.length || 0) < 6 && (
          <View className="gap-sm">
            <Pressable
              onPress={handleTakePhoto}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
              className="w-24 h-24 bg-border rounded-md items-center justify-center border-2 border-dashed border-border-strong"
            >
              <Camera size={24} color="#6B6B6B" />
              <Text className="text-captionStrong text-text-muted mt-xs">Camera</Text>
            </Pressable>
            
            <Pressable
              onPress={handleAddPhoto}
              accessibilityRole="button"
              accessibilityLabel="Add photo from library"
              className="w-24 h-24 bg-border rounded-md items-center justify-center border-2 border-dashed border-border-strong"
            >
              <Plus size={24} color="#6B6B6B" />
              <Text className="text-captionStrong text-text-muted mt-xs">Library</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
  
  const renderStep2 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary mb-sm">Design Brief</Text>
      <Text className="text-body text-text-muted mb-lg">
        Describe the modifications and preferences
      </Text>
      
      <TextInput
        placeholder="Describe the modifications you'd like..."
        value={intake.designBrief || ''}
        onChangeText={setDesignBrief}
        className="p-md bg-bg-elevated rounded-md border border-border text-body min-h-[100px]"
        multiline
        textAlignVertical="top"
      />
      
      <Text className="text-bodyStrong text-text-primary mt-lg mb-sm">Quick Tags</Text>
      <View className="flex-row flex-wrap gap-sm mb-lg">
        {[
          'Wider bridge',
          'Narrower temples',
          'Different color',
          'Different material',
          'Custom engraving',
          'Lens shape change',
        ].map((tag) => (
          <Pressable
            key={tag}
            onPress={() => {
              const current = intake.modifications || '';
              const newMods = current ? `${current}, ${tag}` : tag;
              setModifications(newMods);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add modification: ${tag}`}
            className="px-md py-sm bg-border rounded-full"
          >
            <Text className="text-captionStrong text-text-primary">{tag}</Text>
          </Pressable>
        ))}
      </View>
      
      <Text className="text-bodyStrong text-text-primary mb-sm">Material Preference</Text>
      <View className="flex-row gap-sm mb-lg">
        {(['acetate', 'titanium', 'mixed', 'other'] as MaterialPreference[]).map((material) => (
          <Pressable
            key={material}
            onPress={() => setMaterialPreference(material)}
            accessibilityRole="button"
            accessibilityLabel={`Material preference: ${material}`}
            accessibilityState={{ selected: intake.materialPreference === material }}
            className={`px-md py-sm rounded-md border ${
              intake.materialPreference === material
                ? 'bg-brand border-brand'
                : 'bg-bg-elevated border-border'
            }`}
          >
            <Text className={`text-captionStrong capitalize ${
              intake.materialPreference === material ? 'text-text-inverse' : 'text-text-primary'
            }`}>
              {material}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <Text className="text-bodyStrong text-text-primary mb-sm">Color Preference</Text>
      <TextInput
        placeholder="e.g., tortoise, black, clear, custom..."
        value={intake.colourPreference || ''}
        onChangeText={setColourPreference}
        className="p-md bg-bg-elevated rounded-md border border-border text-body"
      />
    </View>
  );
  
  const renderStep3 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary mb-sm">Measurements</Text>
      <Text className="text-body text-text-muted mb-lg">
        Frame measurements in millimeters (optional)
      </Text>
      
      <View className="gap-md">
        {[
          { key: 'frameWidth', label: 'Frame Width' },
          { key: 'bridgeWidth', label: 'Bridge Width' },
          { key: 'templeLength', label: 'Temple Length' },
          { key: 'lensHeight', label: 'Lens Height' },
          { key: 'lensWidth', label: 'Lens Width' },
        ].map(({ key, label }) => (
          <View key={key} className="flex-row items-center justify-between">
            <Text className="text-bodyStrong text-text-primary flex-1">{label}</Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="--"
                value={intake.measurements?.[key as keyof typeof intake.measurements]?.toString() || ''}
                onChangeText={(text) => {
                  const value = parseFloat(text) || undefined;
                  setMeasurements({ [key]: value });
                }}
                className="w-20 p-sm bg-bg-elevated rounded-md border border-border text-body text-center"
                keyboardType="numeric"
              />
              <Text className="text-body text-text-muted ml-sm">mm</Text>
            </View>
          </View>
        ))}
      </View>
      
      <Pressable 
        accessibilityRole="button"
        accessibilityLabel="Copy measurements from current frames"
        className="mt-lg p-md bg-border rounded-md items-center"
      >
        <Text className="text-bodyStrong text-text-primary">Copy from Current Frames</Text>
        <Text className="text-caption text-text-muted">Uses client fit profile if available</Text>
      </Pressable>
    </View>
  );
  
  const renderStep4 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary mb-sm">Quote Details</Text>
      <Text className="text-body text-text-muted mb-lg">
        Budget range and timeline preferences
      </Text>
      
      <Text className="text-bodyStrong text-text-primary mb-sm">Budget Range</Text>
      <View className="gap-sm mb-lg">
        {(['$500-800', '$800-1200', '$1200-2000', '$2000+'] as BudgetRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setBudgetRange(range)}
            accessibilityRole="button"
            accessibilityLabel={`Budget range: ${range}`}
            accessibilityState={{ selected: intake.budgetRange === range }}
            className={`p-md rounded-md border ${
              intake.budgetRange === range
                ? 'bg-brand border-brand'
                : 'bg-bg-elevated border-border'
            }`}
          >
            <Text className={`text-bodyStrong ${
              intake.budgetRange === range ? 'text-text-inverse' : 'text-text-primary'
            }`}>
              {range}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <Text className="text-bodyStrong text-text-primary mb-sm">Target Completion Date</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Select target completion date"
        className="p-md bg-bg-elevated rounded-md border border-border"
      >
        <Text className="text-body text-text-primary">
          {intake.targetDate || 'Select date (minimum 8 weeks)'}
        </Text>
      </Pressable>
      
      {showDatePicker && (
        <View className="bg-bg-elevated border border-border rounded-md p-md mt-sm">
          <Text className="text-caption text-text-muted mb-sm">Minimum 8 weeks from today</Text>
          <Pressable
            onPress={() => {
              const defaultDate = new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000);
              const dateString = defaultDate.toISOString().split('T')[0] ?? '';
              setTargetDate(dateString);
              setShowDatePicker(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Set target date to 8 weeks from today"
            className="bg-brand rounded-md p-sm items-center"
          >
            <Text className="text-text-inverse text-body">Set to 8 weeks from today</Text>
          </Pressable>
        </View>
      )}
      
      <Text className="text-bodyStrong text-text-primary mt-lg mb-sm">Additional Notes</Text>
      <TextInput
        placeholder="Any other preferences or requirements..."
        value={intake.notes || ''}
        onChangeText={setNotes}
        className="p-md bg-bg-elevated rounded-md border border-border text-body min-h-[100px]"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
  
  const renderStep5 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary mb-sm">Review & Submit</Text>
      <Text className="text-body text-text-muted mb-lg">
        Review all details before submitting for quote
      </Text>
      
      <ScrollView className="flex-1 gap-lg">
        {/* Reference Photos Summary */}
        <View className="p-md bg-bg-elevated rounded-lg border border-border">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-bodyStrong text-text-primary">Reference Photos</Text>
            <Pressable 
              onPress={() => goToStep(1)}
              accessibilityRole="button"
              accessibilityLabel="Edit reference photos"
            >
              <Text className="text-captionStrong text-brand">Edit</Text>
            </Pressable>
          </View>
          <Text className="text-body text-text-muted">
            {intake.referencePhotos?.length || 0} photos added
          </Text>
        </View>
        
        {/* Design Brief Summary */}
        <View className="p-md bg-bg-elevated rounded-lg border border-border">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-bodyStrong text-text-primary">Design Brief</Text>
            <Pressable 
              onPress={() => goToStep(2)}
              accessibilityRole="button"
              accessibilityLabel="Edit design brief"
            >
              <Text className="text-captionStrong text-brand">Edit</Text>
            </Pressable>
          </View>
          <Text className="text-body text-text-muted">
            {intake.designBrief || 'No description provided'}
          </Text>
          {intake.materialPreference && (
            <Text className="text-caption text-text-muted mt-sm">
              Material: {intake.materialPreference}
            </Text>
          )}
          {intake.colourPreference && (
            <Text className="text-caption text-text-muted">
              Color: {intake.colourPreference}
            </Text>
          )}
        </View>
        
        {/* Measurements Summary */}
        <View className="p-md bg-bg-elevated rounded-lg border border-border">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-bodyStrong text-text-primary">Measurements</Text>
            <Pressable 
              onPress={() => goToStep(3)}
              accessibilityRole="button"
              accessibilityLabel="Edit measurements"
            >
              <Text className="text-captionStrong text-brand">Edit</Text>
            </Pressable>
          </View>
          {Object.keys(intake.measurements || {}).length === 0 ? (
            <Text className="text-body text-text-muted">No measurements provided</Text>
          ) : (
            <View className="gap-xs">
              {Object.entries(intake.measurements || {}).map(([key, value]) => (
                value && (
                  <Text key={key} className="text-caption text-text-muted">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}mm
                  </Text>
                )
              ))}
            </View>
          )}
        </View>
        
        {/* Quote Details Summary */}
        <View className="p-md bg-bg-elevated rounded-lg border border-border">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-bodyStrong text-text-primary">Quote Details</Text>
            <Pressable 
              onPress={() => goToStep(4)}
              accessibilityRole="button"
              accessibilityLabel="Edit quote details"
            >
              <Text className="text-captionStrong text-brand">Edit</Text>
            </Pressable>
          </View>
          <Text className="text-body text-text-muted">
            Budget: {intake.budgetRange || 'Not specified'}
          </Text>
          {intake.targetDate && (
            <Text className="text-caption text-text-muted mt-xs">
              Target date: {intake.targetDate}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };
  
  return (
    <View className="flex-1 bg-bg-page">
      {renderStepIndicator()}
      
      <ScrollView className="flex-1 px-2xl">
        {renderCurrentStep()}
      </ScrollView>
      
      {/* Navigation */}
      <View className="flex-row items-center justify-between p-2xl bg-bg-elevated border-t border-border">
        <Pressable
          onPress={currentStep === 1 ? () => router.back() : prevStep}
          accessibilityRole="button"
          accessibilityLabel={currentStep === 1 ? "Cancel custom design" : "Previous step"}
          className="flex-row items-center px-lg py-sm"
        >
          <ChevronLeft size={20} color="#2B2B2B" />
          <Text className="text-bodyStrong text-text-primary ml-xs">
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </Pressable>
        
        {currentStep === 5 ? (
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Submit design for quote"
            className={`flex-row items-center px-lg py-sm rounded-md ${
              isSubmitting ? 'bg-text-muted' : 'bg-accent'
            }`}
          >
            <Text className="text-bodyStrong text-text-inverse mr-xs">
              {isSubmitting ? 'Submitting...' : 'Submit for Quote'}
            </Text>
            <Check size={20} color="white" />
          </Pressable>
        ) : (
          <Pressable
            onPress={nextStep}
            disabled={!canProceedFromStep(currentStep)}
            accessibilityRole="button"
            accessibilityLabel="Next step"
            className={`flex-row items-center px-lg py-sm rounded-md ${
              canProceedFromStep(currentStep) ? 'bg-brand' : 'bg-text-muted'
            }`}
          >
            <Text className="text-bodyStrong text-text-inverse mr-xs">Next</Text>
            <ChevronRight size={20} color="white" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
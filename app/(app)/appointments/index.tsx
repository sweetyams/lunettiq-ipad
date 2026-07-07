import { View, Text, SafeAreaView } from 'react-native';

export default function AppointmentsScreen() {
  return (
    <SafeAreaView className="bg-offWhite flex-1">
      <View className="p-xl">
        <Text className="text-charcoal text-displayMd font-bold mb-md">
          Appointments
        </Text>
        <Text className="text-midGrey text-body">
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
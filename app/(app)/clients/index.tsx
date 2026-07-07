import { View, Text, SafeAreaView } from 'react-native';

export default function ClientsScreen() {
  return (
    <SafeAreaView className="bg-offWhite flex-1">
      <View className="p-xl">
        <Text className="text-charcoal text-displayMd font-bold mb-md">
          Clients
        </Text>
        <Text className="text-midGrey text-body">
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
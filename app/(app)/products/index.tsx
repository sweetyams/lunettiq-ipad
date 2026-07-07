import { View, Text, SafeAreaView } from 'react-native';

export default function ProductsScreen() {
  return (
    <SafeAreaView className="bg-offWhite flex-1">
      <View className="p-xl">
        <Text className="text-charcoal text-displayMd font-bold mb-md">
          Products
        </Text>
        <Text className="text-midGrey text-body">
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
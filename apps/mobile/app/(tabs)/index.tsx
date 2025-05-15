import { Text, View } from "react-native";
import { helloWorldOptions } from "api-client/react-query";
import { useQuery } from "@tanstack/react-query";

export default function Index() {
  const helloWorld = useQuery(helloWorldOptions());

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold">
        Edit app/index.tsx to edit this screen.
      </Text>
      {helloWorld.data ? (
        <Text>{helloWorld.data.message}</Text>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}

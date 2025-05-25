import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { useQuery } from "@tanstack/react-query";
import { helloWorldOptions } from "api-client/react-query";

export default function TabOneScreen() {
  const { data } = useQuery(helloWorldOptions());

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Tab One</Text>
      <View
        className="my-8 h-px w-4/5"
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
      <Text>{data?.message || "Loading..."}</Text>
    </View>
  );
}

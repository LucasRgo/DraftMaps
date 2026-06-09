import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "700" }}>DraftMaps</Text>
      <Text style={{ marginTop: 8, fontSize: 16, color: "#4b5563" }}>
        Places to chill
      </Text>
    </View>
  );
}

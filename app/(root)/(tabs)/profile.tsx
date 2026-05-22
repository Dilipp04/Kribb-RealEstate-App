import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const onLogoutPress = async () => {
    try {
      await signOut();

      router.replace("/sign-in");
    } catch (error) {
      console.error("Error signing OUT", error);
    }
  };
  return (
    <SafeAreaView>
      <TouchableOpacity
        onPress={onLogoutPress}
        className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4">
        <Text className="text-white">LogOut</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

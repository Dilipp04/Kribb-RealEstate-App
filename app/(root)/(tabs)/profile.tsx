import { useUserStore } from "@/store/useStore";
import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = useUserStore((state) => state.isAdmin);

  const onLogoutPress = async () => {
    try {
      await signOut();

      router.replace("/sign-in");
    } catch (error) {
      console.error("Error signing OUT", error);
    }
  };

  const handleUpdateProfileImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to update your profile picture",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      setIsUpdating(true);

      const base64Image = result.assets[0].base64;
      const uri = result.assets[0].uri;
      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      await user?.setProfileImage({ file: dataUrl });

      Alert.alert("Success", "Profile picture updated successsfully");
      setIsUpdating(false);
    } catch (error) {
      console.log(error);
    }
  };

  if (!isLoaded || !user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3882F6" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center py-8">
        <View className="relative">
          <Image
            source={{ uri: user.imageUrl }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <TouchableOpacity
            className="absolute bottom-3 right-0 bg-blue-600 rounded-full p-2"
            disabled={isUpdating}
            onPress={handleUpdateProfileImage}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="camera" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-bold text-gray-800">
          {user.firstName} {user.lastName}
        </Text>

        <Text className="text-gray-500 mt-1">
          {user.emailAddresses[0].emailAddress}
        </Text>
      </View>
      <View className="px-6 gap-2">
        <MenuItem
          icon="heart-outline"
          label="Saved Properties"
          onPress={() => router.push("/(root)/(tabs)/saved")}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() =>
            Alert.alert("Coming soon", "Notifications Comming soon")
          }
        />
        <MenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => Alert.alert("Coming soon", "Settings Comming soon")}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => Linking.openURL("mailto:")}
        />
        {isAdmin && (
          <MenuItem
            icon="add-circle-outline"
            label="Create Property"
            onPress={() => router.push("/(root)/create")}
          />
        )}
      </View>

      <View className="px-6 mt-auto mb-4">
        <TouchableOpacity
          onPress={onLogoutPress}
          className="flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-2xl border-red-100">
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl">
      <Ionicons name={icon} size={22} color="#6B7280" />
      <Text className="flex-1 text-gray-700 font-medium text-base ">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

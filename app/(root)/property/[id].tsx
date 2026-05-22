import { useSavedProperty } from "@/hooks/useSavedProperty";
import { useSupabase } from "@/hooks/useSupabase";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/useStore";
import { Property } from "@/types";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");
const ADMIN_PHONE = "+919199999999";

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const { userId } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();
  const isAdmin = useUserStore((state) => state.isAdmin);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const { isSaved, saveLoading, toggleSave } = useSavedProperty(id ?? "");
  const auth = useSupabase();

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    setProperty(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleContact = () => {
    const message = `Hi i'm interested in the property : ${property?.title}`;
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const handleMarkSold = () => {
    Alert.alert("Mark as Sold", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Sold",
        onPress: async () => {
          const { data, error } = await supabase
            .from("properties")
            .update({ is_sold: true })
            .eq("id", id)
            .select();
          setProperty((prev) => (prev ? { ...prev, is_sold: true } : prev));
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Property", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("properties").delete().eq("id", id);
          router.replace("/(root)/(tabs)");
        },
      },
    ]);
  };

  if (!property) {
    return (
      <View className=" flex-1 items-center justify-center bg-white">
        {loading ? (
          <View className=" ">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <Text className="text-gray-500 ">Property not found</Text>
        )}
      </View>
    );
  }
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.003}%2C${property.latitude - 0.003}%2C${property.longitude + 0.003}%2C${property.latitude + 0.003}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`;

  const isLongDesc = (property.description?.length ?? 0) > 150;
  const displayDesc =
    expanded || !isLongDesc
      ? property.description
      : property.description?.slice(0, 150) + "...";

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={{ opacity: property.is_sold ? 0.5 : 1 }}>
            <FlatList
              data={property.images}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setImageViewerVisible(true)}>
                  <Image
                    source={{ uri: item }}
                    style={{ width, height: 300 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            />
          </View>
          <View className="absolute bottom-3 right-4 bg-black/50 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {activeIndex + 1}/{property.images.length}
            </Text>
          </View>
        </View>

        <SafeAreaView className="absolute top-0 left-0 right-0">
          <View className="flex-row items-center justify-between px-4 pt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              style={{ elevation: 3 }}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSave}
              disabled={saveLoading}
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              style={{ elevation: 3 }}>
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={20}
                color={isSaved ? "#EF4444" : "#111827"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View className="px-5 pt-5 pb-8">
          <View className="flex-row gap-2 mb-3 flex-wrap">
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-semibold capitalize">
                {property.type}
              </Text>
            </View>

            {property.is_featured && (
              <View className="bg-amber-50 px-3 py-1 rounded-full">
                <Text className="text-amber-600 text-xs font-semibold">
                  ⭐ Featured
                </Text>
              </View>
            )}
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {property.title}
          </Text>

          <Text className="text-blue-600 text-xl font-bold mb-4 ">
            {formatPrice(property.price)}
          </Text>

          <View className="flex-row justify-between bg-gray-50 rounded-2xl p-5 mb-5">
            <SpecItem
              icon="bed-outline"
              label="Beds"
              value={`${property.bedrooms} `}
            />
            <SpecItem
              icon="water-outline"
              label="Baths"
              value={`${property.bathrooms} `}
            />
            <SpecItem
              icon="expand-outline"
              label="Area"
              value={`${property.area_sqft} ft²`}
            />
            <SpecItem
              icon="home-outline"
              label="Type"
              value={`${property.type} `}
            />
          </View>

          <Text className="text-base font-bold text-gray-900 mb-2">
            Description
          </Text>

          <Text className="text-gray-500 text-sm leading-6 mb-1">
            {displayDesc}
          </Text>
          {isLongDesc && (
            <TouchableOpacity
              onPress={() => {
                setExpanded(!expanded);
              }}>
              <Text className="text-blue-600 text-sm font-medium mb-5">
                {expanded ? "show less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}

          <Text className="text-base font-bold text-gray-900 mb-2 mt-5">
            Location
          </Text>
          <View className="flex-row items-center gap-2 mb-4 ">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm flex-1">
              {property.address}, {property.city}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(root)/property/map",
                params: {
                  latitude: property.latitude,
                  longitude: property.longitude,
                  title: property.title,
                  address: `${property.address}, ${property.city}`,
                },
              })
            }
            activeOpacity={1}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ height: 200 }}>
            <WebView
              source={{ uri: mapUrl }}
              style={{ flex: 1 }}
              scrollEnabled={false}
              pointerEvents="none"
            />
            <View className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full flex-row items-center gap-1">
              <Ionicons name="expand-outline" size={12} color="#374151" />
              <Text className="text-gray-600 text-xs font-medium">
                Tap to expand
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContact}
            className="flex-row items-center justify-center gap-2 bg-green-600 py-4 rounded-2xl mb-4">
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text className="text-white font-bold">Contact Agent</Text>
          </TouchableOpacity>

          {isAdmin && (
            <View className="flex-row gap-3">
              {!property.is_sold && (
                <TouchableOpacity
                  onPress={handleMarkSold}
                  className="flex-1 flex-row items-center justify-center gap-2 bg-amber-50 py-4 rounded-xl border border-amber-200">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#D97706"
                  />
                  <Text className="text-amber-600 font-semibold">
                    Mark Sold
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-xl border border-red-200">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text className="text-red-500 font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <ImageViewing
        images={property.images.map((uri) => ({ uri }))}
        imageIndex={activeIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="items-center gap-1">
      <Ionicons name={icon} size={20} color="#2563EB" />
      <Text className="text-gray-900 font-bold text-sm">{value}</Text>
      <Text className="text-gray-400 text-xs">{label}</Text>
    </View>
  );
}

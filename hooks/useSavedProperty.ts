import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";

export function useSavedProperty(
  propertyId: string | string[],
  onUnsave?: () => void,
) {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const chechIfSaved = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("user_clerk_id", userId)
      .eq("property_id", propertyId)
      .single();

    setIsSaved(!!data);
  };

  useEffect(() => {
    chechIfSaved();
  }, [propertyId, userId]);

  const toggleSave = async () => {
    if (!userId || saveLoading) return;
    setSaveLoading(true);

    if (isSaved) {
      await supabase
        .from("saved_properties")
        .delete()
        .eq("user_clerk_id", userId)
        .eq("property_id", propertyId);
      setIsSaved(false);
      onUnsave?.();
    } else {
      await supabase.from("saved_properties").insert({
        user_clerk_id: userId,
        property_id: propertyId,
      });
      setIsSaved(true);
    }

    setSaveLoading(false);
  };

  return { isSaved, saveLoading, toggleSave };
}

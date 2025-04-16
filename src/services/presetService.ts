import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { StageItem, StageInputOutput, TechnicalInfo } from "../types/stage";
import { sanitizeForFirestore, convertToStageItems } from "./configService";

// Interface for preset metadata
export interface PresetMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
}

// Interface for Firestore preset document
interface FirestorePreset {
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  items: ReturnType<typeof sanitizeForFirestore>;
  inputOutput?: StageInputOutput;
  technicalInfo?: TechnicalInfo;
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
}

// Interface for client-side use
export interface StagePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  items: StageItem[];
  inputOutput?: StageInputOutput;
  technicalInfo?: TechnicalInfo;
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
}

/**
 * Save a stage layout as a preset
 */
export const savePreset = async (
  name: string,
  description: string,
  category: string,
  items: StageItem[],
  userId: string,
  isPublic: boolean = false,
  inputOutput?: StageInputOutput,
  technicalInfo?: TechnicalInfo,
  thumbnailUrl?: string
): Promise<string> => {
  try {
    // Start with required fields
    const presetData: FirestorePreset = {
      name,
      description,
      category,
      items: sanitizeForFirestore(items),
      createdAt: Timestamp.now(),
      createdBy: userId,
      isPublic,
    };

    // Only add thumbnailUrl if it exists and is not undefined or empty
    if (thumbnailUrl && thumbnailUrl.trim() !== "") {
      presetData.thumbnailUrl = thumbnailUrl;
    }

    // For inputOutput, create a clean version without undefined values
    if (inputOutput) {
      // Clean inputs array
      const cleanInputs =
        inputOutput.inputs?.map((input) => ({
          id: input.id || "",
          number: input.number || "0",
          name: input.name || "",
          channelType: input.channelType || "",
          standType: input.standType || "",
        })) || [];

      // Clean outputs array
      const cleanOutputs =
        inputOutput.outputs?.map((output) => ({
          id: output.id || "",
          number: output.number || "0",
          name: output.name || "",
          channelType: output.channelType || "",
          monitorType: output.monitorType || "",
        })) || [];

      presetData.inputOutput = {
        inputs: cleanInputs,
        outputs: cleanOutputs,
      };
    }

    // For technicalInfo, create a clean version without undefined values
    if (technicalInfo) {
      const cleanTechnicalInfo = {
        projectTitle: technicalInfo.projectTitle || "",
        personnel:
          technicalInfo.personnel?.map((person) => ({
            id: person.id || "",
            name: person.name || "",
            role: person.role || "",
            phone: person.phone || "",
            email: person.email || "",
          })) || [],
        generalInfo: technicalInfo.generalInfo || "",
        houseSystem: technicalInfo.houseSystem || "",
        mixingDesk: technicalInfo.mixingDesk || "",
        monitoring: technicalInfo.monitoring || "",
        backline: technicalInfo.backline || "",
        soundCheck: technicalInfo.soundCheck || "",
      };

      presetData.technicalInfo = cleanTechnicalInfo;
    }

    const docRef = await addDoc(collection(db, "presets"), presetData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving preset:", error);
    throw new Error("Failed to save preset");
  }
};

/**
 * Get all presets available to the user
 * This includes public presets and user's own presets if logged in
 */
export const getAvailablePresets = async (
  userId?: string
): Promise<StagePreset[]> => {
  try {
    let q;
    if (userId) {
      // Get public presets and user's own presets
      q = query(collection(db, "presets"), where("isPublic", "==", true));
    } else {
      // Get only public presets if not logged in
      q = query(collection(db, "presets"), where("isPublic", "==", true));
    }

    const querySnapshot = await getDocs(q);
    const presets: StagePreset[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestorePreset;
      presets.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        thumbnailUrl: data.thumbnailUrl,
        items: convertToStageItems(data.items),
        inputOutput: data.inputOutput,
        technicalInfo: data.technicalInfo,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        isPublic: data.isPublic,
      });
    });

    // If user is logged in, also get their private presets
    if (userId) {
      const userPresetsQuery = query(
        collection(db, "presets"),
        where("createdBy", "==", userId),
        where("isPublic", "==", false)
      );

      const userSnapshot = await getDocs(userPresetsQuery);

      userSnapshot.forEach((doc) => {
        const data = doc.data() as FirestorePreset;
        presets.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          thumbnailUrl: data.thumbnailUrl,
          items: convertToStageItems(data.items),
          inputOutput: data.inputOutput,
          technicalInfo: data.technicalInfo,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          isPublic: data.isPublic,
        });
      });
    }

    return presets;
  } catch (error) {
    console.error("Error getting presets:", error);
    throw new Error("Failed to get presets");
  }
};

/**
 * Get all presets created by the admin user for management
 */
export const getAdminPresets = async (
  userId: string
): Promise<StagePreset[]> => {
  try {
    const q = query(
      collection(db, "presets"),
      where("createdBy", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const presets: StagePreset[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestorePreset;
      presets.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        thumbnailUrl: data.thumbnailUrl,
        items: convertToStageItems(data.items),
        inputOutput: data.inputOutput,
        technicalInfo: data.technicalInfo,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        isPublic: data.isPublic,
      });
    });

    return presets;
  } catch (error) {
    console.error("Error getting admin presets:", error);
    throw new Error("Failed to get admin presets");
  }
};

/**
 * Get a single preset by ID
 */
export const getPresetById = async (
  presetId: string
): Promise<StagePreset | null> => {
  try {
    const presetRef = doc(db, "presets", presetId);
    const presetSnap = await getDoc(presetRef);

    if (!presetSnap.exists()) {
      return null;
    }

    const data = presetSnap.data() as FirestorePreset;

    return {
      id: presetSnap.id,
      name: data.name,
      description: data.description,
      category: data.category,
      thumbnailUrl: data.thumbnailUrl,
      items: convertToStageItems(data.items),
      inputOutput: data.inputOutput,
      technicalInfo: data.technicalInfo,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      isPublic: data.isPublic,
    };
  } catch (error) {
    console.error("Error getting preset:", error);
    throw new Error("Failed to get preset");
  }
};

/**
 * Update an existing preset
 */
export const updatePreset = async (
  presetId: string,
  updates: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    items?: StageItem[];
    inputOutput?: StageInputOutput;
    technicalInfo?: TechnicalInfo;
    thumbnailUrl?: string;
  }
): Promise<void> => {
  try {
    const presetRef = doc(db, "presets", presetId);
    const presetSnap = await getDoc(presetRef);

    if (!presetSnap.exists()) {
      throw new Error("Preset does not exist");
    }

    const updateData: Record<string, unknown> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.category) updateData.category = updates.category;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    // Only add thumbnailUrl if it has a value (not undefined or empty string)
    if (updates.thumbnailUrl && updates.thumbnailUrl.trim() !== "") {
      updateData.thumbnailUrl = updates.thumbnailUrl;
    }

    if (updates.items) {
      updateData.items = sanitizeForFirestore(updates.items);
    }

    if (updates.inputOutput) {
      updateData.inputOutput = updates.inputOutput;
    }

    if (updates.technicalInfo) {
      updateData.technicalInfo = updates.technicalInfo;
    }

    await setDoc(presetRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating preset:", error);
    throw new Error("Failed to update preset");
  }
};

/**
 * Delete a preset
 */
export const deletePreset = async (presetId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "presets", presetId));
  } catch (error) {
    console.error("Error deleting preset:", error);
    throw new Error("Failed to delete preset");
  }
};

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { StageItem, Category, StageInputOutput } from "../types/stage";

// For storing in Firestore
interface StorableItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

// Input/Output interfaces for Firestore
interface StorableInputRow {
  id: string;
  number: number;
  name: string;
  channelType: string;
  standType: string;
}

interface StorableOutputRow {
  id: string;
  number: number;
  name: string;
  channelType: string;
  standType: string;
}

interface StorableInputOutput {
  inputs: StorableInputRow[];
  outputs: StorableOutputRow[];
}

// Interface for Firestore document
interface FirestoreStageConfig {
  name: string;
  userId: string;
  items: StorableItem[];
  inputOutput?: StorableInputOutput;
  createdAt: Timestamp;
  lastAccessed?: Timestamp; // Optional for backward compatibility
}

// Interface for client-side use
export interface SavedConfig {
  id: string;
  name: string;
  userId: string;
  items: StageItem[];
  inputOutput?: StageInputOutput;
  createdAt: Timestamp;
  lastAccessed?: Timestamp; // Optional for backward compatibility
}

// Clean and prepare items for Firestore storage
function sanitizeForFirestore(items: StageItem[]): StorableItem[] {
  console.log("Original items:", JSON.stringify(items));
  return items.map((item) => ({
    id: String(item.id || ""),
    name: String(item.name || ""),
    category: String(item.category || ""),
    icon: String(item.icon || ""),
    posX: Number(item.position?.x || 0),
    posY: Number(item.position?.y || 0),
    width: Number(item.width || 200),
    height: Number(item.height || 200),
  }));
}

// Sanitize input/output data for Firestore
function sanitizeInputOutputForFirestore(
  inputOutput?: StageInputOutput
): StorableInputOutput | undefined {
  if (!inputOutput) return undefined;

  return {
    inputs: inputOutput.inputs.map((input) => ({
      id: String(input.id || ""),
      number: Number(input.number || 0),
      name: String(input.name || ""),
      channelType: String(input.channelType || ""),
      standType: String(input.standType || ""),
    })),
    outputs: inputOutput.outputs.map((output) => ({
      id: String(output.id || ""),
      number: Number(output.number || 0),
      name: String(output.name || ""),
      channelType: String(output.channelType || ""),
      standType: String(output.standType || ""),
    })),
  };
}

// Convert Firestore items back to StageItem format
function convertToStageItems(items: StorableItem[]): StageItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category as Category, // Type cast to match the expected enum
    icon: item.icon,
    position: {
      x: item.posX,
      y: item.posY,
    },
    width: item.width,
    height: item.height,
  }));
}

// Convert Firestore input/output back to StageInputOutput format
function convertToStageInputOutput(
  inputOutput?: StorableInputOutput
): StageInputOutput | undefined {
  if (!inputOutput) return undefined;

  return {
    inputs: inputOutput.inputs.map((input) => ({
      id: input.id,
      number: input.number,
      name: input.name,
      channelType: input.channelType,
      standType: input.standType,
    })),
    outputs: inputOutput.outputs.map((output) => ({
      id: output.id,
      number: output.number,
      name: output.name,
      channelType: output.channelType,
      standType: output.standType,
    })),
  };
}

// Save a configuration to Firestore
export const saveConfiguration = async (
  userId: string,
  name: string,
  items: StageItem[],
  inputOutput?: StageInputOutput
): Promise<string> => {
  try {
    // First check if there are items
    if (!items || !items.length) {
      throw new Error("No items to save");
    }

    const sanitizedItems = sanitizeForFirestore(items);
    const sanitizedInputOutput = sanitizeInputOutputForFirestore(inputOutput);

    // Create a simple object with just primitive types
    const configData = {
      name: String(name),
      userId: String(userId),
      items: sanitizedItems,
      inputOutput: sanitizedInputOutput,
      createdAt: Timestamp.now(),
      lastAccessed: Timestamp.now(), // Set initial lastAccessed to creation time
    };

    console.log("Saving to Firestore:", JSON.stringify(configData, null, 2));

    // Option 1: Using addDoc
    try {
      const docRef = await addDoc(collection(db, "stage-configs"), configData);
      return docRef.id;
    } catch (error) {
      console.error("Error with addDoc, trying setDoc:", error);

      // Option 2: Using setDoc with a generated ID
      const newDocId = String(Date.now());
      await setDoc(doc(db, "stage-configs", newDocId), configData);
      return newDocId;
    }
  } catch (error) {
    console.error("Error saving configuration:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    } else {
      throw new Error("Failed to save configuration: Unknown error");
    }
  }
};

// Get all configurations for a user
export const getUserConfigurations = async (
  userId: string
): Promise<SavedConfig[]> => {
  try {
    const configurationsRef = collection(db, "stage-configs");
    const q = query(configurationsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const configurations: SavedConfig[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreStageConfig;

      configurations.push({
        id: doc.id,
        name: data.name,
        userId: data.userId,
        items: convertToStageItems(data.items || []),
        inputOutput: convertToStageInputOutput(data.inputOutput),
        createdAt: data.createdAt,
        lastAccessed: data.lastAccessed,
      });
    });

    // Sort by lastAccessed timestamp, newest first
    return configurations.sort((a, b) => {
      // If both have lastAccessed, compare those
      if (a.lastAccessed && b.lastAccessed) {
        return b.lastAccessed.toMillis() - a.lastAccessed.toMillis();
      }
      // If only one has lastAccessed, prioritize that one
      if (a.lastAccessed) return -1;
      if (b.lastAccessed) return 1;
      // Fall back to creation date if neither has lastAccessed
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error("Error getting configurations:", error);
    throw new Error("Failed to get configurations");
  }
};

// Delete a configuration
export const deleteConfiguration = async (configId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "stage-configs", configId));
  } catch (error) {
    console.error("Error deleting configuration:", error);
    throw new Error("Failed to delete configuration");
  }
};

// Get the most recent configuration for a user
export const getLatestConfiguration = async (
  userId: string
): Promise<SavedConfig | null> => {
  try {
    // Re-use the getUserConfigurations function which already sorts by newest first
    const configurations = await getUserConfigurations(userId);

    // Return the first (most recent) config or null if none exist
    return configurations.length > 0 ? configurations[0] : null;
  } catch (error) {
    console.error("Error getting latest configuration:", error);
    throw new Error("Failed to get latest configuration");
  }
};

// Update the lastAccessed timestamp for a configuration
export const updateLastAccessed = async (configId: string): Promise<void> => {
  try {
    const configRef = doc(db, "stage-configs", configId);
    await setDoc(configRef, { lastAccessed: Timestamp.now() }, { merge: true });
    console.log(`Updated lastAccessed timestamp for config ${configId}`);
  } catch (error) {
    console.error("Error updating lastAccessed timestamp:", error);
    // Don't throw an error as this is not critical functionality
  }
};

// Update an existing configuration with new items
export const updateConfiguration = async (
  configId: string,
  items: StageItem[],
  inputOutput?: StageInputOutput
): Promise<void> => {
  try {
    if (!items || !items.length) {
      throw new Error("No items to save");
    }

    const configRef = doc(db, "stage-configs", configId);
    const sanitizedItems = sanitizeForFirestore(items);
    const sanitizedInputOutput = sanitizeInputOutputForFirestore(inputOutput);

    await setDoc(
      configRef,
      {
        items: sanitizedItems,
        inputOutput: sanitizedInputOutput,
        lastAccessed: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`Configuration ${configId} updated successfully`);
  } catch (error) {
    console.error("Error updating configuration:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update configuration: ${error.message}`);
    } else {
      throw new Error("Failed to update configuration: Unknown error");
    }
  }
};

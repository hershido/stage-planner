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
import {
  StageItem,
  Category,
  StageInputOutput,
  TechnicalInfo,
} from "../types/stage";

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
  isFlipped?: boolean;
  textContent?: string;
  textFormatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    fontSize?: number;
    textColor?: string;
  };
}

// Input/Output interfaces for Firestore
interface StorableInputRow {
  id: string;
  number: number;
  name: string;
  channelType: string;
  standType: string;
  originalNumber?: string; // Optional field for non-numeric values
}

interface StorableOutputRow {
  id: string;
  number: number;
  name: string;
  channelType: string;
  monitorType: string;
  originalNumber?: string; // Optional field for non-numeric values
}

interface StorableInputOutput {
  inputs: StorableInputRow[];
  outputs: StorableOutputRow[];
}

// New interface for storing technical info in Firestore
interface StorablePerson {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

interface StorableTechnicalInfo {
  projectTitle: string;
  personnel: StorablePerson[];
  generalInfo: string;
  houseSystem: string;
  mixingDesk: string;
  monitoring: string;
  backline: string;
  soundCheck: string;
}

// Interface for Firestore document
interface FirestoreStageConfig {
  name: string;
  userId: string;
  items: StorableItem[];
  inputOutput?: StorableInputOutput;
  technicalInfo?: StorableTechnicalInfo; // Add technical info
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
  technicalInfo?: TechnicalInfo; // Add technical info
  createdAt: Timestamp;
  lastAccessed?: Timestamp; // Optional for backward compatibility
}

// Clean and prepare items for Firestore storage
function sanitizeForFirestore(items: StageItem[]): StorableItem[] {
  console.log("Original items:", JSON.stringify(items));
  return items.map((item) => {
    // Create the base item with required fields
    const sanitizedItem: StorableItem = {
      id: String(item.id || ""),
      name: String(item.name || ""),
      category: String(item.category || ""),
      icon: String(item.icon || ""),
      posX: Number(item.position?.x || 0),
      posY: Number(item.position?.y || 0),
      width: Number(item.width || 200),
      height: Number(item.height || 200),
      isFlipped: Boolean(item.isFlipped),
    };

    // Add textContent only if it's defined and not null
    if (item.textContent !== undefined && item.textContent !== null) {
      sanitizedItem.textContent = String(item.textContent);
    }

    // Add textFormatting only if it exists and has defined properties
    if (item.textFormatting) {
      const formatting: {
        isBold?: boolean;
        isItalic?: boolean;
        fontSize?: number;
        textColor?: string;
      } = {};

      // Add each property only if it's defined
      if (item.textFormatting.isBold !== undefined) {
        formatting.isBold = Boolean(item.textFormatting.isBold);
      }

      if (item.textFormatting.isItalic !== undefined) {
        formatting.isItalic = Boolean(item.textFormatting.isItalic);
      }

      if (item.textFormatting.fontSize !== undefined) {
        formatting.fontSize = Number(item.textFormatting.fontSize || 14);
      }

      if (item.textFormatting.textColor !== undefined) {
        formatting.textColor = String(
          item.textFormatting.textColor || "#333333"
        );
      }

      // Only add the formatting object if it has any properties
      if (Object.keys(formatting).length > 0) {
        sanitizedItem.textFormatting = formatting;
      }
    }

    return sanitizedItem;
  });
}

// Sanitize input/output data for Firestore
function sanitizeInputOutputForFirestore(
  inputOutput?: StageInputOutput
): StorableInputOutput | undefined {
  if (!inputOutput) return undefined;

  const sanitized: StorableInputOutput = {
    inputs: [],
    outputs: [],
  };

  // Process inputs if they exist
  if (Array.isArray(inputOutput.inputs)) {
    sanitized.inputs = inputOutput.inputs.map((input) => {
      // Store the number as a string in a separate field if it's not a valid number
      const numValue = Number(input.number);
      const isValidNumber = !isNaN(numValue);

      const sanitizedInput: StorableInputRow = {
        id: String(input.id || ""),
        number: isValidNumber ? numValue : 0, // Use 0 as default for sorting
        name: String(input.name || ""),
        channelType: String(input.channelType || ""),
        standType: String(input.standType || ""),
      };

      // Add originalNumber as a properly typed field
      if (!isValidNumber) {
        sanitizedInput.originalNumber = String(input.number || "");
      }

      return sanitizedInput;
    });
  }

  // Process outputs if they exist
  if (Array.isArray(inputOutput.outputs)) {
    sanitized.outputs = inputOutput.outputs.map((output) => {
      // Store the number as a string in a separate field if it's not a valid number
      const numValue = Number(output.number);
      const isValidNumber = !isNaN(numValue);

      const sanitizedOutput: StorableOutputRow = {
        id: String(output.id || ""),
        number: isValidNumber ? numValue : 0, // Use 0 as default for sorting
        name: String(output.name || ""),
        channelType: String(output.channelType || ""),
        monitorType: String(output.monitorType || ""),
      };

      // Add originalNumber as a properly typed field
      if (!isValidNumber) {
        sanitizedOutput.originalNumber = String(output.number || "");
      }

      return sanitizedOutput;
    });
  }

  return sanitized;
}

// Sanitize technical info for Firestore
function sanitizeTechnicalInfoForFirestore(
  technicalInfo?: TechnicalInfo
): StorableTechnicalInfo | undefined {
  if (!technicalInfo) return undefined;

  const sanitized: StorableTechnicalInfo = {
    projectTitle: String(technicalInfo.projectTitle || ""),
    personnel: [],
    generalInfo: String(technicalInfo.generalInfo || ""),
    houseSystem: String(technicalInfo.houseSystem || ""),
    mixingDesk: String(technicalInfo.mixingDesk || ""),
    monitoring: String(technicalInfo.monitoring || ""),
    backline: String(technicalInfo.backline || ""),
    soundCheck: String(technicalInfo.soundCheck || ""),
  };

  // Process personnel if they exist
  if (Array.isArray(technicalInfo.personnel)) {
    sanitized.personnel = technicalInfo.personnel.map((person) => {
      const sanitizedPerson: StorablePerson = {
        id: String(person.id || ""),
        name: String(person.name || ""),
        role: String(person.role || ""),
      };

      // Only add optional fields if they're defined
      if (person.phone) {
        sanitizedPerson.phone = String(person.phone);
      }

      if (person.email) {
        sanitizedPerson.email = String(person.email);
      }

      return sanitizedPerson;
    });
  }

  return sanitized;
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
    isFlipped: item.isFlipped,
    textContent: item.textContent,
    textFormatting: item.textFormatting
      ? {
          isBold: item.textFormatting.isBold,
          isItalic: item.textFormatting.isItalic,
          fontSize: item.textFormatting.fontSize,
          textColor: item.textFormatting.textColor,
        }
      : undefined,
  }));
}

// Convert Firestore input/output back to StageInputOutput format
function convertToStageInputOutput(
  inputOutput?: StorableInputOutput
): StageInputOutput | undefined {
  if (!inputOutput) return undefined;

  return {
    inputs: Array.isArray(inputOutput.inputs)
      ? inputOutput.inputs.map((input) => {
          return {
            id: input.id,
            // Use originalNumber if available, otherwise convert number to string
            number:
              input.originalNumber !== undefined
                ? input.originalNumber
                : String(input.number),
            name: input.name,
            channelType: input.channelType,
            standType: input.standType,
          };
        })
      : [],
    outputs: Array.isArray(inputOutput.outputs)
      ? inputOutput.outputs.map((output) => {
          return {
            id: output.id,
            // Use originalNumber if available, otherwise convert number to string
            number:
              output.originalNumber !== undefined
                ? output.originalNumber
                : String(output.number),
            name: output.name,
            channelType: output.channelType,
            monitorType: output.monitorType,
          };
        })
      : [],
  };
}

// Convert Firestore technical info back to TechnicalInfo format
function convertToTechnicalInfo(
  technicalInfo?: StorableTechnicalInfo
): TechnicalInfo | undefined {
  if (!technicalInfo) return undefined;

  return {
    projectTitle: technicalInfo.projectTitle,
    personnel: Array.isArray(technicalInfo.personnel)
      ? technicalInfo.personnel.map((person) => ({
          id: person.id,
          name: person.name,
          role: person.role,
          phone: person.phone,
          email: person.email,
        }))
      : [],
    generalInfo: technicalInfo.generalInfo,
    houseSystem: technicalInfo.houseSystem,
    mixingDesk: technicalInfo.mixingDesk,
    monitoring: technicalInfo.monitoring,
    backline: technicalInfo.backline,
    soundCheck: technicalInfo.soundCheck,
  };
}

// Save a configuration to Firestore
export const saveConfiguration = async (
  userId: string,
  name: string,
  items: StageItem[],
  inputOutput?: StageInputOutput,
  technicalInfo?: TechnicalInfo
): Promise<string> => {
  try {
    // First check if there are items
    if (!items || !items.length) {
      throw new Error("No items to save");
    }

    console.log("Starting save configuration with items:", items.length);

    const sanitizedItems = sanitizeForFirestore(items);
    console.log("Sanitized items:", sanitizedItems);

    const sanitizedInputOutput = sanitizeInputOutputForFirestore(inputOutput);
    const sanitizedTechnicalInfo =
      sanitizeTechnicalInfoForFirestore(technicalInfo);

    // Create a simple object with just primitive types
    const configData: {
      name: string;
      userId: string;
      items: StorableItem[];
      inputOutput?: StorableInputOutput;
      technicalInfo?: StorableTechnicalInfo;
      createdAt: Timestamp;
      lastAccessed: Timestamp;
    } = {
      name: String(name),
      userId: String(userId),
      items: sanitizedItems,
      createdAt: Timestamp.now(),
      lastAccessed: Timestamp.now(), // Set initial lastAccessed to creation time
    };

    // Only add these fields if they're defined (not undefined)
    if (sanitizedInputOutput) {
      configData.inputOutput = sanitizedInputOutput;
    }

    if (sanitizedTechnicalInfo) {
      configData.technicalInfo = sanitizedTechnicalInfo;
    }

    console.log(
      "Final save data to be sent to Firestore:",
      JSON.stringify(
        configData,
        (value) => (value === undefined ? "<<UNDEFINED>>" : value),
        2
      )
    );

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
        technicalInfo: convertToTechnicalInfo(data.technicalInfo),
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
  inputOutput?: StageInputOutput,
  technicalInfo?: TechnicalInfo
): Promise<void> => {
  try {
    if (!items || !items.length) {
      throw new Error("No items to save");
    }

    console.log("Starting update configuration with items:", items.length);

    const configRef = doc(db, "stage-configs", configId);
    const sanitizedItems = sanitizeForFirestore(items);
    console.log("Sanitized items:", sanitizedItems);

    const sanitizedInputOutput = sanitizeInputOutputForFirestore(inputOutput);
    const sanitizedTechnicalInfo =
      sanitizeTechnicalInfoForFirestore(technicalInfo);

    // Create an update object with only defined values
    const updateData: {
      items: StorableItem[];
      inputOutput?: StorableInputOutput;
      technicalInfo?: StorableTechnicalInfo;
      lastAccessed: Timestamp;
    } = {
      items: sanitizedItems,
      lastAccessed: Timestamp.now(),
    };

    // Only add these fields if they're defined (not undefined)
    if (sanitizedInputOutput) {
      updateData.inputOutput = sanitizedInputOutput;
    }

    if (sanitizedTechnicalInfo) {
      updateData.technicalInfo = sanitizedTechnicalInfo;
    }

    console.log(
      "Final update data to be sent to Firestore:",
      JSON.stringify(
        updateData,
        (value) => (value === undefined ? "<<UNDEFINED>>" : value),
        2
      )
    );

    await setDoc(configRef, updateData, { merge: true });

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

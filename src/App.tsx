import { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Stage from "./components/Stage";
import Sidebar from "./components/Sidebar";
import SidePanel from "./components/SidePanel";
import Header, { SaveStatus } from "./components/Header";
import Login from "./components/Login";
import UserMenu from "./components/UserMenu";
import {
  StageItem,
  DraggableItem,
  StageInputOutput,
  TechnicalInfo,
} from "./types/stage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "./context/AuthContext";
import {
  getLatestConfiguration,
  updateLastAccessed,
  updateConfiguration,
} from "./services/configService";
import "./App.css";
import { v4 as uuidv4 } from "uuid";
import { SaveChangesDialog } from "./components/SaveChangesDialog";

// File System Access API types
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

// Extend the Window interface instead of redefining it
interface CustomWindow extends Window {
  showSaveFilePicker?: (
    options?: ShowSaveFilePickerOptions
  ) => Promise<FileSystemFileHandle>;
}

// Define a type for our history entry
interface HistoryEntry {
  items: StageItem[];
  latestItemId: string | null;
}

function App() {
  const { currentUser, loading } = useAuth();
  const [items, setItems] = useState<StageItem[]>([]);
  const [latestItemId, setLatestItemId] = useState<string | null>(null);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string | null>(
    null
  );
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [inputOutput, setInputOutput] = useState<StageInputOutput>({
    inputs: [],
    outputs: [],
  });
  const [technicalInfo, setTechnicalInfo] = useState<TechnicalInfo>({
    projectTitle: "",
    personnel: [],
    generalInfo: "",
    houseSystem: "",
    mixingDesk: "",
    monitoring: "",
    backline: "",
    soundCheck: "",
  });
  const [showSaveChangesDialog, setShowSaveChangesDialog] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Use refs instead of state for the save/load functions to prevent re-renders
  const exportConfigRef = useRef<() => void>(() => {
    console.log("Default exportConfig called - not yet initialized");
  });
  const importConfigRef = useRef<() => void>(() => {
    console.log("Default importConfig called - not yet initialized");
  });

  // Add state for UI updates only
  const [historyLength, setHistoryLength] = useState(1);

  // Use useRef to avoid closure issues with history state
  const historyRef = useRef<HistoryEntry[]>([
    { items: [], latestItemId: null },
  ]);

  // Add a ref to track when we're loading a configuration
  const isLoadingConfigRef = useRef(false);

  // Add a ref to track component mount time
  const mountTimeRef = useRef(Date.now());

  // Add state to track if we've made a title change
  const [hasTitleChanged, setHasTitleChanged] = useState(false);

  // Add state for save status and error message
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handler for input/output changes
  const handleInputOutputChange = useCallback(
    (newInputOutput: StageInputOutput) => {
      // Always update the state even if we're in loading mode
      setInputOutput(newInputOutput);

      // Don't mark as having unsaved changes if we're loading a configuration
      if (isLoadingConfigRef.current) {
        console.log("Ignoring input/output change during loading");
        return;
      }

      // For safety, don't mark as changed during the first 2 seconds after loading a config
      if (currentConfigId) {
        const timeSinceMount = Date.now() - mountTimeRef.current;
        if (timeSinceMount < 2000) {
          console.log("Ignoring input/output change during initial render");
          return;
        }
      }

      // Deep comparison to avoid unnecessary unsaved changes flags
      const isSimilar = (a: StageInputOutput, b: StageInputOutput): boolean => {
        // Compare lengths first
        if (
          a.inputs.length !== b.inputs.length ||
          a.outputs.length !== b.outputs.length
        ) {
          return false;
        }

        // Check if any inputs have meaningful content that differs
        for (let i = 0; i < a.inputs.length; i++) {
          const inputA = a.inputs[i];
          const inputB = b.inputs[i];

          // Compare relevant fields
          if (
            inputA.name !== inputB.name ||
            inputA.channelType !== inputB.channelType ||
            inputA.standType !== inputB.standType
          ) {
            return false;
          }
        }

        // Check if any outputs have meaningful content that differs
        for (let i = 0; i < a.outputs.length; i++) {
          const outputA = a.outputs[i];
          const outputB = b.outputs[i];

          // Compare relevant fields
          if (
            outputA.name !== outputB.name ||
            outputA.channelType !== outputB.channelType ||
            outputA.monitorType !== outputB.monitorType
          ) {
            return false;
          }
        }

        // If we got here, everything is similar enough
        return true;
      };

      // Check if there's any meaningful difference before marking as unsaved
      if (!isSimilar(inputOutput, newInputOutput)) {
        // Check if there's any content in the input/output tables
        const hasContent =
          newInputOutput.inputs.some(
            (i) => i.name || i.channelType || i.standType
          ) ||
          newInputOutput.outputs.some(
            (o) => o.name || o.channelType || o.monitorType
          ) ||
          newInputOutput.inputs.length > 1 ||
          newInputOutput.outputs.length > 1;

        // Only mark as having unsaved changes if there's actual content
        if (hasContent) {
          console.log("Marking as unsaved due to input/output change");
          setHasUnsavedChanges(true);
        }
      }
    },
    [inputOutput, currentConfigId, mountTimeRef]
  );

  // Function to add a new entry to history
  const addToHistory = useCallback(
    (
      newItems: StageItem[],
      newLatestItemId: string | null,
      isInitialLoad: boolean = false
    ) => {
      if (isUndoRedoAction) {
        // Don't add to history if this change is from an undo/redo action
        setIsUndoRedoAction(false);
        return;
      }

      console.log("Adding history entry with items:", newItems.length);

      // Deep clone items to ensure proper history separation
      const clonedItems = newItems.map((item) => ({
        ...item,
        position: { ...item.position },
      }));

      // Get current history from ref to avoid stale closure values
      const currentHistory = historyRef.current;
      const currentIndex = currentHistory.length - 1;

      // Remove any "future" history if we've gone back and then made a new action
      const newHistory = currentHistory.slice(0, currentIndex + 1);

      // Add the new state to history
      newHistory.push({
        items: clonedItems,
        latestItemId: newLatestItemId,
      });

      // Limit history size to prevent memory issues
      if (newHistory.length > 100) {
        newHistory.shift();
      }

      // Update the refs and state
      historyRef.current = newHistory;
      setCurrentHistoryIndex(newHistory.length - 1);

      // Update UI states
      setHistoryLength(newHistory.length);

      // Only mark as unsaved if this is not an initial load, we're not currently loading a config,
      // and we have actual content
      if (!isInitialLoad && !isLoadingConfigRef.current) {
        setHasUnsavedChanges(true);
      }

      console.log(
        `History entry added. Total: ${newHistory.length}, Current index: ${
          newHistory.length - 1
        }`
      );
    },
    [isUndoRedoAction]
  );

  // Undo function
  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentIndex = currentHistory.length - 1;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = currentHistory[newIndex];

      // Deep clone the items to avoid reference issues
      const clonedItems = previousState.items.map((item) => ({
        ...item,
        position: { ...item.position },
      }));

      console.log(
        `Undoing to history entry #${newIndex} with ${clonedItems.length} items`
      );

      setIsUndoRedoAction(true);
      setCurrentHistoryIndex(newIndex);
      setItems(clonedItems);
      setLatestItemId(previousState.latestItemId);

      // Mark as having unsaved changes if we're not at the initial state (index 0)
      setHasUnsavedChanges(newIndex > 0);
    } else {
      console.log("Nothing to undo");
    }
  }, []);

  // Redo function
  const handleRedo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentIndex = currentHistory.length - 1;

    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      const nextState = currentHistory[newIndex];

      // Deep clone the items to avoid reference issues
      const clonedItems = nextState.items.map((item) => ({
        ...item,
        position: { ...item.position },
      }));

      console.log(
        `Redoing to history entry #${newIndex} with ${clonedItems.length} items`
      );

      setIsUndoRedoAction(true);
      setCurrentHistoryIndex(newIndex);
      setItems(clonedItems);
      setLatestItemId(nextState.latestItemId);

      // Always mark as having unsaved changes after redo
      setHasUnsavedChanges(true);
    } else {
      console.log("Nothing to redo");
    }
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Z (Undo) or Ctrl+Z (Undo)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Check for Cmd+Shift+Z (Redo) or Ctrl+Shift+Z (Redo)
      else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Add a safeguard to reset hasUnsavedChanges after creating a new config
  useEffect(() => {
    if (!currentConfigId && !currentConfigName) {
      // Give a slight delay to ensure other state updates have completed
      const timer = setTimeout(() => {
        setHasUnsavedChanges(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentConfigId, currentConfigName]);

  // Function to initialize input/output tables with one empty row each
  const initializeEmptyInputOutput = useCallback(() => {
    return {
      inputs: [
        {
          id: uuidv4(),
          number: "1",
          name: "",
          channelType: "",
          standType: "",
        },
      ],
      outputs: [
        {
          id: uuidv4(),
          number: "1",
          name: "",
          channelType: "",
          monitorType: "",
        },
      ],
    };
  }, []);

  // Handler for importing stage configuration
  const handleImport = useCallback(
    (
      importedItems: StageItem[],
      configName: string,
      configId?: string,
      importedInputOutput?: StageInputOutput,
      importedTechnicalInfo?: TechnicalInfo
    ) => {
      console.log(
        "Importing stage configuration with",
        importedItems.length,
        "items"
      );
      console.log("Configuration name being loaded:", configName);

      // Set the loading flag to true
      isLoadingConfigRef.current = true;

      // First reset hasUnsavedChanges to avoid any flickering
      setHasUnsavedChanges(false);

      // Reset title changed flag when loading a configuration
      setHasTitleChanged(false);

      // Replace current items with imported ones
      setItems(importedItems);
      setLatestItemId(null); // Reset latest ID since we're loading a new config

      // Set the configuration name and ID
      setCurrentConfigName(configName);
      setCurrentConfigId(configId || null);

      // Set input/output data if it exists, otherwise initialize with empty structure with one row each
      setInputOutput(importedInputOutput || initializeEmptyInputOutput());

      // Set technical info if it exists
      setTechnicalInfo(
        importedTechnicalInfo || {
          projectTitle: "",
          personnel: [],
          generalInfo: "",
          houseSystem: "",
          mixingDesk: "",
          monitoring: "",
          backline: "",
          soundCheck: "",
        }
      );

      // Add the imported state to history as the initial load
      addToHistory(importedItems, null, true);

      // Update last accessed timestamp if we have a config ID
      if (configId) {
        updateLastAccessed(configId);
      }

      // Reset hasUnsavedChanges after a longer delay to ensure all state updates have completed
      setTimeout(() => {
        setHasUnsavedChanges(false);
        setHasTitleChanged(false); // Also reset title changed flag after a delay
        console.log("Reset hasUnsavedChanges after import");
        console.log("Current config name after loading:", configName);

        // Keep loading flag active longer
        setTimeout(() => {
          isLoadingConfigRef.current = false;
          console.log("Reset loading flag after import");
        }, 1000);
      }, 500);
    },
    [addToHistory, initializeEmptyInputOutput]
  );

  // Handler for updating just the items from text editing
  const handleItemsUpdate = useCallback(
    (updatedItems: StageItem[]) => {
      console.log("Updating items from text edit:", updatedItems.length);

      // Update the items state
      setItems(updatedItems);

      // Only mark as having unsaved changes if we're not loading a configuration
      if (!isLoadingConfigRef.current) {
        setHasUnsavedChanges(true);
      }

      // Add to history
      addToHistory(updatedItems, null);
    },
    [addToHistory]
  );

  // Load the most recent configuration when the app starts
  useEffect(() => {
    const loadLatestConfig = async () => {
      // Only attempt to load if user is authenticated
      if (currentUser) {
        try {
          console.log("Attempting to load most recent configuration...");
          isLoadingConfigRef.current = true; // Set loading flag
          const latestConfig = await getLatestConfiguration(currentUser.uid);

          if (latestConfig) {
            console.log(
              `Found latest configuration: ${latestConfig.name} with ${latestConfig.items.length} items`
            );
            // Use the existing handleImport function to load the configuration
            handleImport(
              latestConfig.items,
              latestConfig.name,
              latestConfig.id,
              latestConfig.inputOutput,
              latestConfig.technicalInfo
            );
          } else {
            console.log("No saved configurations found");
            // Reset loading flag if no config was found
            setTimeout(() => {
              isLoadingConfigRef.current = false;
            }, 50);
          }
        } catch (error) {
          console.error("Error loading latest configuration:", error);
          // Reset loading flag if there was an error
          isLoadingConfigRef.current = false;
          // Don't show an error to the user - if this fails, they'll just start with an empty stage
        }
      }
    };

    loadLatestConfig();
  }, [currentUser, handleImport]); // Re-run if the user changes or handleImport changes

  // Ensure we don't mark the app as having unsaved changes after loading
  useEffect(() => {
    // Wait for any initial data loading to complete
    const timer = setTimeout(() => {
      if (currentConfigId) {
        // If we have a configuration loaded, reset unsaved changes flag
        // but only if we're not actively editing the title and haven't just changed the title
        if (
          !document.activeElement?.tagName.toLowerCase().includes("input") &&
          !hasTitleChanged
        ) {
          console.log("Resetting unsaved changes flag for", currentConfigName);
          setHasUnsavedChanges(false);
        } else {
          console.log(
            "Not resetting unsaved changes flag - user is editing input or title was changed"
          );
        }
      }
    }, 1000); // Use a longer timeout to ensure all state changes have settled

    return () => clearTimeout(timer);
  }, [currentConfigId, currentConfigName, hasTitleChanged]);

  // Add an effect that runs on every render to check for unwanted changes
  useEffect(() => {
    // Only run this check if we're not explicitly making changes
    if (currentConfigId && !isLoadingConfigRef.current && hasUnsavedChanges) {
      console.log(
        "Detected unwanted change flag - checking if this is a false positive"
      );

      // If this happens immediately after loading, reset the flag
      const timer = setTimeout(() => {
        const timeSinceMount = Date.now() - mountTimeRef.current;
        // Only reset if this happens within 2 seconds of mount and the name hasn't been manually changed
        if (
          timeSinceMount < 2000 &&
          currentConfigName !== "Untitled" &&
          !document.activeElement?.tagName.toLowerCase().includes("input") &&
          !hasTitleChanged
        ) {
          console.log(
            "Detected false positive for unsaved changes - resetting flag"
          );
          setHasUnsavedChanges(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentConfigId, hasUnsavedChanges, currentConfigName, hasTitleChanged]);

  // Reset the mount time ref on each load
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, [currentConfigId]);

  // Handler for "Save As" to create a new configuration
  const handleSaveAs = useCallback(() => {
    // We're using the existing modal in ConfigManager for "Save As"
    // This just opens the modal - actual saving is handled in the ConfigManager component
    console.log("Opening Save As modal");
  }, []);

  // Handler for saving current configuration
  const handleSave = useCallback(async () => {
    if (!currentUser) return;

    try {
      // If configuration hasn't been saved yet (no ID), trigger save as flow
      if (!currentConfigId) {
        console.log("No configuration ID yet - triggering Save As flow");
        handleSaveAs();
        return;
      }

      if (!currentConfigName) {
        console.error("Missing configuration name");
        return;
      }

      // Only proceed with save if we actually have unsaved changes
      if (!hasUnsavedChanges && !hasTitleChanged) {
        console.log("No changes to save");
        return;
      }

      // Set status to saving
      setSaveStatus("saving");
      setSaveError(null);

      console.log(`Saving configuration '${currentConfigName}'...`);
      console.log("Current items state being saved:", items);
      console.log("Current name being saved:", currentConfigName);

      // Set loading flag to prevent unwanted resets during save
      isLoadingConfigRef.current = true;

      // Explicitly ensure we have the latest state of items, including the current name
      await updateConfiguration(
        currentConfigId,
        items,
        inputOutput,
        technicalInfo,
        currentConfigName // Pass the current name to be updated in the datastore
      );

      // Reset unsaved changes flag
      setHasUnsavedChanges(false);

      // Reset title changed flag
      setHasTitleChanged(false);

      // Update save status to saved
      setSaveStatus("saved");

      // Log the updated name for debugging
      console.log(`Configuration saved with name: ${currentConfigName}`);

      // Reset loading flag after a delay to ensure all state updates complete
      setTimeout(() => {
        isLoadingConfigRef.current = false;

        // Reset save status after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }, 100);
    } catch (error) {
      // Reset loading flag on error
      isLoadingConfigRef.current = false;

      console.error("Error saving configuration:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setSaveStatus("error");
      setSaveError(`Failed to save: ${errorMessage}`);

      // Reset error state after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveError(null);
      }, 5000);
    }
  }, [
    currentUser,
    currentConfigId,
    currentConfigName,
    items,
    inputOutput,
    technicalInfo,
    hasUnsavedChanges,
    hasTitleChanged,
    handleSaveAs,
  ]);

  // Handler for creating a new empty configuration
  const handleNewConfig = useCallback(() => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges || hasTitleChanged) {
      setShowSaveChangesDialog(true);
    } else {
      // No unsaved changes, just clear everything
      setItems([]);
      setLatestItemId(null);
      setCurrentConfigName("Untitled");
      setCurrentConfigId(null);
      // Create a new empty input/output object
      const emptyInputOutput = {
        inputs: [
          {
            id: uuidv4(),
            number: "1",
            name: "",
            channelType: "",
            standType: "",
          },
        ],
        outputs: [
          {
            id: uuidv4(),
            number: "1",
            name: "",
            channelType: "",
            monitorType: "",
          },
        ],
      };
      setInputOutput(emptyInputOutput);
      setTechnicalInfo({
        projectTitle: "",
        personnel: [],
        generalInfo: "",
        houseSystem: "",
        mixingDesk: "",
        monitoring: "",
        backline: "",
        soundCheck: "",
      });

      // Reset history
      historyRef.current = [{ items: [], latestItemId: null }];
      setCurrentHistoryIndex(0);
      setHistoryLength(1);

      // Explicitly set hasUnsavedChanges to false after a slight delay
      setTimeout(() => {
        setHasUnsavedChanges(false);
        setHasTitleChanged(false);
      }, 0);
    }
  }, [hasUnsavedChanges, hasTitleChanged]);

  const handleSaveChangesDialogClose = useCallback(
    (choice: "yes" | "no" | "cancel") => {
      setShowSaveChangesDialog(false);

      if (choice === "yes") {
        // Save changes first
        handleSave()
          .then(() => {
            // After saving, clear everything
            setItems([]);
            setLatestItemId(null);
            setCurrentConfigName("Untitled");
            setCurrentConfigId(null);
            // Create a new empty input/output object
            const emptyInputOutput = {
              inputs: [
                {
                  id: uuidv4(),
                  number: "1",
                  name: "",
                  channelType: "",
                  standType: "",
                },
              ],
              outputs: [
                {
                  id: uuidv4(),
                  number: "1",
                  name: "",
                  channelType: "",
                  monitorType: "",
                },
              ],
            };
            setInputOutput(emptyInputOutput);
            setTechnicalInfo({
              projectTitle: "",
              personnel: [],
              generalInfo: "",
              houseSystem: "",
              mixingDesk: "",
              monitoring: "",
              backline: "",
              soundCheck: "",
            });

            // Reset history
            historyRef.current = [{ items: [], latestItemId: null }];
            setCurrentHistoryIndex(0);
            setHistoryLength(1);

            // Explicitly set hasUnsavedChanges to false after a slight delay
            setTimeout(() => {
              setHasUnsavedChanges(false);
              setHasTitleChanged(false);
            }, 0);
          })
          .catch((error) => {
            console.error("Error saving before clearing:", error);
            alert("Failed to save configuration. Please try again.");
          });
      } else if (choice === "no") {
        // User chose not to save, just clear everything
        setItems([]);
        setLatestItemId(null);
        setCurrentConfigName("Untitled");
        setCurrentConfigId(null);
        // Create a new empty input/output object
        const emptyInputOutput = {
          inputs: [
            {
              id: uuidv4(),
              number: "1",
              name: "",
              channelType: "",
              standType: "",
            },
          ],
          outputs: [
            {
              id: uuidv4(),
              number: "1",
              name: "",
              channelType: "",
              monitorType: "",
            },
          ],
        };
        setInputOutput(emptyInputOutput);
        setTechnicalInfo({
          projectTitle: "",
          personnel: [],
          generalInfo: "",
          houseSystem: "",
          mixingDesk: "",
          monitoring: "",
          backline: "",
          soundCheck: "",
        });

        // Reset history
        historyRef.current = [{ items: [], latestItemId: null }];
        setCurrentHistoryIndex(0);
        setHistoryLength(1);

        // Explicitly set hasUnsavedChanges to false after a slight delay
        setTimeout(() => {
          setHasUnsavedChanges(false);
          setHasTitleChanged(false);
        }, 0);
      }
      // If choice === "cancel", do nothing
    },
    [handleSave]
  );

  // Function to export stage to PDF
  const handleExportPDF = useCallback(() => {
    if (!stageContainerRef.current) return;

    const stageElement = stageContainerRef.current.querySelector("#stage");
    if (!stageElement) {
      console.error("Stage element not found");
      return;
    }

    console.log("Generating PDF...");

    // Temporarily hide selection styling
    const selectionElements = stageElement.querySelectorAll(
      '[style*="border: 2px solid #3498db"]'
    );
    const resizeHandles = stageElement.querySelectorAll(
      '[style*="position: absolute"][style*="backgroundColor: #3498db"]'
    );
    const deleteButtons = stageElement.querySelectorAll(
      'button[style*="position: absolute"][style*="top: -25px"]'
    );
    const lassoRectangle = stageElement.querySelector(
      'div[style*="border: 1px dashed #3498db"]'
    );

    // Save original visibility state
    const originalStyles: Array<{ element: Element; style: string }> = [];

    // Hide selection borders and handles
    selectionElements.forEach((el) => {
      const element = el as HTMLElement;
      originalStyles.push({ element, style: element.style.cssText });
      element.style.border = "none";
      element.style.boxShadow = "none";
    });

    // Hide resize handles
    resizeHandles.forEach((el) => {
      const element = el as HTMLElement;
      originalStyles.push({ element, style: element.style.cssText });
      element.style.display = "none";
    });

    // Hide delete buttons
    deleteButtons.forEach((el) => {
      const element = el as HTMLElement;
      originalStyles.push({ element, style: element.style.cssText });
      element.style.display = "none";
    });

    // Hide lasso rectangle if visible
    if (lassoRectangle) {
      const element = lassoRectangle as HTMLElement;
      originalStyles.push({ element, style: element.style.cssText });
      element.style.display = "none";
    }

    // Use html2canvas to capture the stage
    html2canvas(stageElement as HTMLElement, {
      backgroundColor: "#ffffff",
      scale: 3, // Higher scale for better quality
      useCORS: true, // Try to load images with CORS if possible
      allowTaint: true, // Allow cross-origin images
      imageTimeout: 0, // No timeout for images
      onclone: (clonedDoc) => {
        // Find all images in the cloned document that will be rendered
        const images = clonedDoc.querySelectorAll("#stage img");
        const containers = clonedDoc.querySelectorAll("#stage > div > div");

        // Fix all image containers to preserve dimensions
        containers.forEach((container) => {
          const containerEl = container as HTMLElement;
          if (containerEl.style) {
            // Ensure containers maintain proper dimensions
            containerEl.style.display = "flex";
            containerEl.style.alignItems = "center";
            containerEl.style.justifyContent = "center";
          }
        });

        // Fix all images to preserve aspect ratio
        images.forEach((img) => {
          // Ensure images maintain their aspect ratio and are properly contained
          const imgEl = img as HTMLElement;
          if (imgEl.style) {
            imgEl.style.maxWidth = "100%";
            imgEl.style.maxHeight = "100%";
            imgEl.style.width = "auto";
            imgEl.style.height = "auto";
            imgEl.style.objectFit = "contain";
            imgEl.style.display = "block";
            imgEl.style.margin = "auto";
          }
        });

        return clonedDoc;
      },
    })
      .then((canvas) => {
        // Calculate dimensions to fit the stage properly in the PDF
        const imgData = canvas.toDataURL("image/png", 1.0); // Use max quality

        // Create PDF starting with portrait orientation for technical info with UTF-8 support
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          hotfixes: ["px_scaling"], // Add hotfixes to improve text handling
          putOnlyUsedFonts: true,
          compress: true,
        });

        // Helper function to safely render text with potential non-Latin characters
        const renderTextWithFallback = (
          text: string,
          x: number,
          y: number,
          options?: { align: "center" | "right" | "left" | "justify" }
        ) => {
          try {
            // Try to render with default fonts
            pdf.text(text, x, y, options);
          } catch (e) {
            console.warn(
              "Error rendering text, falling back to basic characters:",
              e
            );
            // Fallback to only ASCII characters if rendering fails
            pdf.text(
              text.replace(/[^\x20-\x7E]/g, "?"), // Replace non-ASCII with question marks
              x,
              y,
              options
            );
          }
        };

        // Define common styles and margins
        const pageMargin = 15; // mm, increased from 10mm
        const contentWidth = pdf.internal.pageSize.getWidth() - pageMargin * 2;

        // Add a footer with page number to each page
        const addFooter = (pageNum: number) => {
          const totalPages = pdf.getNumberOfPages();
          pdf.setPage(pageNum);
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          renderTextWithFallback(
            `Page ${pageNum} of ${totalPages}`,
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 7,
            { align: "center" }
          );

          // Add generated timestamp
          const timestamp = new Date().toLocaleString();
          renderTextWithFallback(
            `Generated: ${timestamp}`,
            pdf.internal.pageSize.getWidth() - pageMargin,
            pdf.internal.pageSize.getHeight() - 7,
            { align: "right" }
          );

          // Add project name at bottom left
          if (currentConfigName) {
            renderTextWithFallback(
              currentConfigName,
              pageMargin,
              pdf.internal.pageSize.getHeight() - 7,
              { align: "left" }
            );
          }
        };

        // Add a decorative header to each page
        const addHeader = (title: string, subtitle?: string) => {
          // Get current position and page
          const pageWidth = pdf.internal.pageSize.getWidth();

          // Add header background
          pdf.setFillColor(240, 240, 240);
          pdf.rect(0, 0, pageWidth, 25, "F");

          // Add subtle line
          pdf.setDrawColor(200, 200, 200);
          pdf.line(pageMargin, 25, pageWidth - pageMargin, 25);

          // Add title
          pdf.setFontSize(16);
          pdf.setTextColor(60, 60, 60);
          renderTextWithFallback(title, pageWidth / 2, 15, { align: "center" });

          // Add subtitle if provided
          if (subtitle) {
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            renderTextWithFallback(subtitle, pageWidth / 2, 22, {
              align: "center",
            });
          }

          return 35; // Return the Y position after the header
        };

        // Get portrait page dimensions
        const portraitHeight = pdf.internal.pageSize.getHeight();

        // Start with project title or default title
        const mainTitle = technicalInfo?.projectTitle || "Stage Plan";
        let yPosition = addHeader("Technical Information", mainTitle);

        // 1. FIRST ADD TECHNICAL INFO
        if (technicalInfo) {
          // Add personnel section if exists
          if (technicalInfo.personnel && technicalInfo.personnel.length > 0) {
            pdf.setFontSize(14);
            pdf.setTextColor(50, 50, 50);
            renderTextWithFallback("Personnel", pageMargin, yPosition);
            yPosition += 8;

            // Create personnel table
            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);

            // Calculate column widths with proper spacing
            const colPadding = 5; // Add padding inside columns
            const nameColWidth = 40;
            const roleColWidth = 40;
            const phoneColWidth = 35;
            // Email will use remaining space, no need to calculate width

            // Draw table headers with background
            pdf.setFillColor(240, 240, 240);
            pdf.rect(pageMargin, yPosition - 5, contentWidth, 8, "F");

            // Position headers with padding
            renderTextWithFallback("Name", pageMargin + colPadding, yPosition);
            renderTextWithFallback(
              "Role",
              pageMargin + nameColWidth + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Phone",
              pageMargin + nameColWidth + roleColWidth + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Email",
              pageMargin +
                nameColWidth +
                roleColWidth +
                phoneColWidth +
                colPadding,
              yPosition
            );
            yPosition += 2;

            // Draw horizontal line
            pdf.setDrawColor(180, 180, 180);
            pdf.line(
              pageMargin,
              yPosition,
              pageMargin + contentWidth,
              yPosition
            );
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(50, 50, 50);

            // Add personnel rows
            technicalInfo.personnel.forEach((person, index) => {
              // Add zebra striping for better readability
              if (index % 2 === 0) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(pageMargin, yPosition - 5, contentWidth, 7, "F");
              }

              // Add cell data with proper padding
              renderTextWithFallback(
                person.name || "-",
                pageMargin + colPadding,
                yPosition
              );
              renderTextWithFallback(
                person.role || "-",
                pageMargin + nameColWidth + colPadding,
                yPosition
              );
              renderTextWithFallback(
                person.phone || "-",
                pageMargin + nameColWidth + roleColWidth + colPadding,
                yPosition
              );

              // For email - simply display the full email without wrapping or truncation
              const emailText = person.email || "-";
              const emailX =
                pageMargin +
                nameColWidth +
                roleColWidth +
                phoneColWidth +
                colPadding;
              renderTextWithFallback(emailText, emailX, yPosition);

              yPosition += 7;
            });

            yPosition += 10;
          }

          // Helper function to add a section with title and content
          const addSection = (title: string, content: string) => {
            if (!content) return false;

            // Check if new page is needed (less than 40mm remaining)
            if (yPosition > portraitHeight - 40) {
              pdf.addPage("", "portrait");
              yPosition = addHeader(
                "Technical Information - Continued",
                mainTitle
              );
            }

            pdf.setFontSize(14);
            pdf.setTextColor(50, 50, 50);
            renderTextWithFallback(title, pageMargin, yPosition);
            yPosition += 8;

            // Add a light background for the section content
            pdf.setFillColor(250, 250, 250);

            // Calculate the height needed for text
            pdf.setFontSize(10);
            const splitText = pdf.splitTextToSize(content, contentWidth);
            const textHeight = splitText.length * 5 + 10;

            // Draw background
            pdf.rect(
              pageMargin - 3,
              yPosition - 5,
              contentWidth + 6,
              textHeight,
              "F"
            );

            // Add border
            pdf.setDrawColor(230, 230, 230);
            pdf.rect(
              pageMargin - 3,
              yPosition - 5,
              contentWidth + 6,
              textHeight,
              "S"
            );

            // Add text
            pdf.setTextColor(60, 60, 60);

            // Handle multiline text with potential non-Latin characters
            splitText.forEach((line: string, i: number) => {
              renderTextWithFallback(line, pageMargin, yPosition + i * 5);
            });

            yPosition += textHeight + 10;

            return true;
          };

          // Add each section if it has content
          if (technicalInfo.generalInfo)
            addSection("General Information", technicalInfo.generalInfo);

          if (technicalInfo.houseSystem)
            addSection("House System", technicalInfo.houseSystem);

          if (technicalInfo.mixingDesk) {
            // Convert to string if it's an array
            const mixingDeskStr = Array.isArray(technicalInfo.mixingDesk)
              ? technicalInfo.mixingDesk.join(", ")
              : technicalInfo.mixingDesk;
            addSection("Mixing Desk", mixingDeskStr);
          }

          if (technicalInfo.monitoring)
            addSection("Monitoring", technicalInfo.monitoring);

          if (technicalInfo.backline)
            addSection("Backline", technicalInfo.backline);

          if (technicalInfo.soundCheck)
            addSection("Sound Check", technicalInfo.soundCheck);
        }

        // 2. THEN ADD INPUT/OUTPUT LISTS
        if (
          inputOutput &&
          (inputOutput.inputs.length > 0 || inputOutput.outputs.length > 0)
        ) {
          // Add a new page in portrait orientation for I/O tables if needed
          if (yPosition > portraitHeight - 100) {
            pdf.addPage("", "portrait");
            yPosition = addHeader("Input/Output Lists", mainTitle);
          } else {
            // Draw a divider
            pdf.setDrawColor(200, 200, 200);
            pdf.line(
              pageMargin,
              yPosition,
              pageMargin + contentWidth,
              yPosition
            );

            yPosition += 15;
            pdf.setFontSize(14);
            pdf.setTextColor(50, 50, 50);
            renderTextWithFallback("Input/Output Lists", pageMargin, yPosition);
            yPosition += 10;
          }

          // Add Input table if there are inputs
          if (inputOutput.inputs.length > 0) {
            pdf.setFontSize(12);
            pdf.setTextColor(50, 50, 50);
            renderTextWithFallback("Input List", pageMargin, yPosition);
            yPosition += 8;

            // Set up table headers
            pdf.setFontSize(10);

            // Calculate column widths with proper spacing for inputs
            const colPadding = 5; // Add padding inside columns
            const numColWidth = 15;
            const nameColWidth = contentWidth - 110;
            const channelColWidth = 60;

            // Add header background
            pdf.setFillColor(240, 240, 240);
            pdf.rect(pageMargin, yPosition - 5, contentWidth, 8, "F");

            // Draw table headers with padding
            pdf.setTextColor(80, 80, 80);
            renderTextWithFallback(
              "Input #",
              pageMargin + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Channel Name",
              pageMargin + numColWidth + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Mic/DI Type",
              pageMargin + numColWidth + nameColWidth + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Stand Type",
              pageMargin +
                numColWidth +
                nameColWidth +
                channelColWidth +
                colPadding,
              yPosition
            );
            yPosition += 2;

            // Draw horizontal line under headers
            pdf.setDrawColor(180, 180, 180);
            pdf.line(
              pageMargin,
              yPosition,
              pageMargin + contentWidth,
              yPosition
            );
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(50, 50, 50);

            // Add each input row
            inputOutput.inputs.forEach((input, index) => {
              // Add zebra striping for better readability
              if (index % 2 === 0) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(pageMargin, yPosition - 5, contentWidth, 7, "F");
              }

              renderTextWithFallback(
                input.number.toString(),
                pageMargin + colPadding,
                yPosition
              );

              // Limit name text if it's too long
              const nameText = input.name || "-";
              if (
                pdf.getStringUnitWidth(nameText) * 10 >
                nameColWidth - colPadding * 2
              ) {
                const maxChars = Math.floor(
                  (nameColWidth - colPadding * 2) /
                    (pdf.getStringUnitWidth("a") * 10)
                );
                const truncatedName = nameText.substring(0, maxChars) + "...";
                renderTextWithFallback(
                  truncatedName,
                  pageMargin + numColWidth + colPadding,
                  yPosition
                );
              } else {
                renderTextWithFallback(
                  nameText,
                  pageMargin + numColWidth + colPadding,
                  yPosition
                );
              }

              renderTextWithFallback(
                input.channelType || "-",
                pageMargin + numColWidth + nameColWidth + colPadding,
                yPosition
              );
              renderTextWithFallback(
                input.standType || "-",
                pageMargin +
                  numColWidth +
                  nameColWidth +
                  channelColWidth +
                  colPadding,
                yPosition
              );
              yPosition += 7;
            });

            yPosition += 10;
          }

          // Add Output table if there are outputs and enough space
          if (inputOutput.outputs.length > 0) {
            // Check if we need a new page (if less than 60mm remaining)
            if (yPosition > portraitHeight - 60) {
              pdf.addPage("", "portrait");
              yPosition = addHeader(
                "Input/Output Lists - Continued",
                mainTitle
              );
            }

            pdf.setFontSize(12);
            pdf.setTextColor(50, 50, 50);
            renderTextWithFallback("Output List", pageMargin, yPosition);
            yPosition += 8;

            // Set up table headers
            pdf.setFontSize(10);

            // Calculate column widths with proper spacing for outputs
            const colPadding = 5; // Add padding inside columns
            const numColWidth = 15;
            const nameColWidth = contentWidth - 70;

            // Add header background
            pdf.setFillColor(240, 240, 240);
            pdf.rect(pageMargin, yPosition - 5, contentWidth, 8, "F");

            // Draw table headers with padding
            pdf.setTextColor(80, 80, 80);
            renderTextWithFallback(
              "Output #",
              pageMargin + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Channel Name",
              pageMargin + numColWidth + colPadding,
              yPosition
            );
            renderTextWithFallback(
              "Monitor Type",
              pageMargin + numColWidth + nameColWidth + colPadding,
              yPosition
            );
            yPosition += 2;

            // Draw horizontal line under headers
            pdf.setDrawColor(180, 180, 180);
            pdf.line(
              pageMargin,
              yPosition,
              pageMargin + contentWidth,
              yPosition
            );
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(50, 50, 50);

            // Add each output row
            inputOutput.outputs.forEach((output, index) => {
              // Add zebra striping for better readability
              if (index % 2 === 0) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(pageMargin, yPosition - 5, contentWidth, 7, "F");
              }

              renderTextWithFallback(
                output.number.toString(),
                pageMargin + colPadding,
                yPosition
              );

              // Limit name text if it's too long
              const nameText = output.name || "-";
              if (
                pdf.getStringUnitWidth(nameText) * 10 >
                nameColWidth - colPadding * 2
              ) {
                const maxChars = Math.floor(
                  (nameColWidth - colPadding * 2) /
                    (pdf.getStringUnitWidth("a") * 10)
                );
                const truncatedName = nameText.substring(0, maxChars) + "...";
                renderTextWithFallback(
                  truncatedName,
                  pageMargin + numColWidth + colPadding,
                  yPosition
                );
              } else {
                renderTextWithFallback(
                  nameText,
                  pageMargin + numColWidth + colPadding,
                  yPosition
                );
              }

              renderTextWithFallback(
                output.monitorType || "-",
                pageMargin + numColWidth + nameColWidth + colPadding,
                yPosition
              );
              yPosition += 7;
            });
          }
        }

        // 3. FINALLY ADD THE STAGE DIAGRAM
        // Add the stage as the last page in landscape orientation
        pdf.addPage("", "landscape");

        // Get landscape page dimensions
        const landscapeWidth = pdf.internal.pageSize.getWidth();
        const landscapeHeight = pdf.internal.pageSize.getHeight();

        // Add header to stage diagram page
        yPosition = addHeader("Stage Diagram", mainTitle);

        // Calculate the image dimensions while preserving aspect ratio
        const canvasRatio = canvas.width / canvas.height;

        // Set margins - increase for better appearance
        const margin = pageMargin; // Use same margin as other pages
        const maxWidth = landscapeWidth - margin * 2;
        const maxHeight = landscapeHeight - margin - yPosition - 15; // Account for header and footer

        // Determine dimensions based on aspect ratio
        let imgWidth, imgHeight;

        if (canvasRatio > maxWidth / maxHeight) {
          // Image is wider than the available space (width limited)
          imgWidth = maxWidth;
          imgHeight = imgWidth / canvasRatio;
        } else {
          // Image is taller than the available space (height limited)
          imgHeight = maxHeight;
          imgWidth = imgHeight * canvasRatio;
        }

        // Center the image on the page
        const xPos = margin + (maxWidth - imgWidth) / 2;

        // Position vertically below the header
        const yPos = yPosition + 5;

        // Add a subtle border around the stage diagram
        pdf.setDrawColor(200, 200, 200);
        pdf.roundedRect(
          xPos - 5,
          yPos - 5,
          imgWidth + 10,
          imgHeight + 10,
          3,
          3,
          "S"
        );

        // Add the stage image to the PDF with minimal compression
        pdf.addImage({
          imageData: imgData,
          format: "PNG",
          x: xPos,
          y: yPos,
          width: imgWidth,
          height: imgHeight,
          compression: "NONE", // Better quality with no compression
        });

        // Add footers to all pages
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          addFooter(i);
        }

        // Generate the filename with configuration name and date
        const currentDate = new Date().toLocaleDateString().replace(/\//g, "-");
        const fileName = currentConfigName
          ? `${currentConfigName.replace(
              /[/\\?%*:|"<>]/g,
              "-"
            )}-${currentDate}.pdf`
          : `stage-plan-${currentDate}.pdf`;

        // Create a blob from the PDF to use with showSaveFilePicker
        const pdfBlob = pdf.output("blob");

        // Use the File System Access API if available (Chrome, Edge)
        if ("showSaveFilePicker" in window) {
          const opts: ShowSaveFilePickerOptions = {
            suggestedName: fileName,
            types: [
              {
                description: "PDF File",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          };

          // Show the system save dialog
          (window as unknown as CustomWindow).showSaveFilePicker!(opts)
            .then(async (fileHandle: FileSystemFileHandle) => {
              // Get a writable stream to the file
              const writable = await fileHandle.createWritable();
              // Write the PDF blob to the file
              await writable.write(pdfBlob);
              // Close the file and finalize it
              await writable.close();
              console.log("PDF saved successfully");
            })
            .catch((err: { name: string; message: string }) => {
              // Check if this is a user cancellation (AbortError)
              if (err.name === "AbortError") {
                console.log("Save dialog was canceled by user");
                // Do nothing if user canceled
                return;
              }

              // Only fall back to download for other types of errors
              console.log("Error in save dialog:", err);
              // Create a URL for the blob
              const blobUrl = URL.createObjectURL(pdfBlob);
              // Create a link element and trigger the download
              const a = document.createElement("a");
              a.href = blobUrl;
              a.download = fileName;
              a.click();
              // Clean up
              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            });
        } else {
          // Fallback for browsers without File System Access API
          const blobUrl = URL.createObjectURL(pdfBlob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileName;
          a.click();
          // Clean up
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        }

        // Restore original styles
        originalStyles.forEach((item) => {
          (item.element as HTMLElement).style.cssText = item.style;
        });

        console.log("PDF generated successfully");
      })
      .catch((error) => {
        // Restore original styles even if there was an error
        originalStyles.forEach((item) => {
          (item.element as HTMLElement).style.cssText = item.style;
        });

        console.error("Error generating PDF:", error);
      });
  }, [items, inputOutput, technicalInfo, currentConfigName]);

  const handleDrop = useCallback(
    (item: DraggableItem, position: { x: number; y: number }) => {
      console.log("handleDrop called with:", item, position);

      const timestamp = Date.now();
      const newId = `${item.name}-${timestamp}`;

      // Use default width/height from item if available, otherwise use 100 as fallback
      const itemWidth = item.defaultWidth || 100;
      const itemHeight = item.defaultHeight || 100;

      const newItem: StageItem = {
        id: newId,
        name: item.name,
        category: item.type,
        icon: item.icon,
        position,
        width: itemWidth,
        height: itemHeight,
        // Initialize textContent for Text Label items
        textContent: item.name === "Text Label" ? "Click to edit" : undefined,
      };

      console.log(
        "Creating new item with dimensions:",
        newItem.width,
        "x",
        newItem.height
      );

      setItems((currentItems) => {
        const newItems = [...currentItems, newItem];
        console.log("Adding new item to state:", newItem);

        // Add this action to history
        addToHistory(newItems, newId);

        return newItems;
      });

      console.log("Setting latest item ID for selection:", newId);
      setLatestItemId(newId);
    },
    [addToHistory]
  );

  // Handle click on sidebar item
  const handleSidebarItemClick = useCallback(
    (item: DraggableItem) => {
      console.log("Sidebar item clicked:", item);

      // Calculate the center position of the stage
      const stageWidth = 1200; // Should match the width prop of Stage
      const stageHeight = 800; // Should match the height prop of Stage

      // Get item dimensions with fallbacks
      const itemWidth = item.defaultWidth || 100;
      const itemHeight = item.defaultHeight || 100;

      // Place the item at the center of the stage
      const position = {
        x: Math.max(0, stageWidth / 2 - itemWidth / 2), // Center X based on item width
        y: Math.max(0, stageHeight / 2 - itemHeight / 2), // Center Y based on item height
      };

      // Use the existing handleDrop function to add the item
      handleDrop(item, position);
    },
    [handleDrop]
  );

  const handleMove = useCallback(
    (id: string, position: { x: number; y: number }) => {
      console.log("handleMove called for id:", id, "position:", position);

      setItems((currentItems) => {
        const newItems = currentItems.map((item) => {
          if (item.id === id) {
            console.log("Moving item:", item.id);
            return { ...item, position };
          }
          return item;
        });

        // Add to history
        addToHistory(newItems, latestItemId);

        return newItems;
      });
    },
    [addToHistory, latestItemId]
  );

  const handleDelete = useCallback(
    (id: string) => {
      console.log("Deleting item:", id);

      setItems((currentItems) => {
        const newItems = currentItems.filter((item) => item.id !== id);

        // Update history
        const newLatestItemId = latestItemId === id ? null : latestItemId;
        addToHistory(newItems, newLatestItemId);

        return newItems;
      });

      setLatestItemId((currentId) => (currentId === id ? null : currentId));
    },
    [addToHistory, latestItemId]
  );

  const handleResize = useCallback(
    (
      id: string,
      size: { width: number; height: number; isFlipped?: boolean }
    ) => {
      console.log("Resizing item:", id, "to", size);

      setItems((currentItems) => {
        const newItems = currentItems.map((item) => {
          if (item.id === id) {
            // Check if isFlipped is defined in the size parameter
            if (typeof size.isFlipped !== "undefined") {
              return {
                ...item,
                width: size.width,
                height: size.height,
                isFlipped: size.isFlipped,
              };
            }
            // Otherwise just update width and height
            return { ...item, width: size.width, height: size.height };
          }
          return item;
        });

        // Add to history
        addToHistory(newItems, latestItemId);

        return newItems;
      });
    },
    [addToHistory, latestItemId]
  );

  const handleDuplicate = useCallback(
    (id: string, position: { x: number; y: number }) => {
      console.log("Duplicating item:", id, "at position:", position);

      setItems((currentItems) => {
        // Find the item to duplicate
        const originalItem = currentItems.find((item) => item.id === id);
        if (!originalItem) return currentItems;

        // Create a new ID with timestamp
        const timestamp = Date.now();
        const newId = `${originalItem.name}-${timestamp}`;

        // Create a duplicate with new ID and position
        const duplicatedItem: StageItem = {
          ...originalItem,
          id: newId,
          position,
        };

        console.log("Created duplicate item:", duplicatedItem);

        // Add the new item to the state
        const newItems = [...currentItems, duplicatedItem];

        // Add to history (with the new item as latest)
        addToHistory(newItems, newId);

        // Set it as latest
        setLatestItemId(newId);

        return newItems;
      });
    },
    [addToHistory]
  );

  const handleItemSelected = useCallback(() => {
    setLatestItemId(null);
  }, []);

  // Handler for title changes
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      // Only do something if the title actually changed
      if (newTitle !== currentConfigName) {
        console.log(
          `Changing title from "${currentConfigName}" to "${newTitle}"`
        );

        // Update the title in the UI
        setCurrentConfigName(newTitle);

        // Explicitly mark as having unsaved changes to show the asterisk
        // This is IMPORTANT to ensure the save button is enabled
        setHasUnsavedChanges(true);

        // Set flag that we've changed the title
        setHasTitleChanged(true);

        // Log the change
        console.log("Setting hasUnsavedChanges to TRUE after title change");

        // If we have a configId, log that this will be updated on save
        if (currentConfigId) {
          console.log(
            `Title change will be saved to configuration #${currentConfigId} on next save`
          );
        }

        // Set mount time to a large value to prevent auto-reset of changes flag
        mountTimeRef.current = Date.now() - 10000; // 10 seconds ago
      }
    },
    [currentConfigName, currentConfigId]
  );

  // Function to handle technical info changes
  const handleTechnicalInfoChange = useCallback(
    (newTechnicalInfo: TechnicalInfo) => {
      // Don't mark as having unsaved changes if we're loading a configuration
      if (isLoadingConfigRef.current) {
        setTechnicalInfo(newTechnicalInfo);
        return;
      }

      // Deep equality check to avoid unnecessary updates and unsaved changes flag
      const isSame = (a: TechnicalInfo, b: TechnicalInfo): boolean => {
        // Compare all simple properties first
        if (
          a.projectTitle !== b.projectTitle ||
          a.generalInfo !== b.generalInfo ||
          a.houseSystem !== b.houseSystem ||
          a.mixingDesk !== b.mixingDesk ||
          a.monitoring !== b.monitoring ||
          a.backline !== b.backline ||
          a.soundCheck !== b.soundCheck
        ) {
          return false;
        }

        // Check personnel arrays length first
        if (a.personnel.length !== b.personnel.length) {
          return false;
        }

        // Check each personnel item deeply
        for (let i = 0; i < a.personnel.length; i++) {
          const personA = a.personnel[i];
          const personB = b.personnel[i];

          if (
            personA.id !== personB.id ||
            personA.name !== personB.name ||
            personA.role !== personB.role ||
            personA.phone !== personB.phone ||
            personA.email !== personB.email
          ) {
            return false;
          }
        }

        // If we made it here, all properties are the same
        return true;
      };

      // Check if the new technical info has any content
      const hasContent =
        newTechnicalInfo.projectTitle ||
        newTechnicalInfo.generalInfo ||
        newTechnicalInfo.houseSystem ||
        newTechnicalInfo.mixingDesk ||
        newTechnicalInfo.monitoring ||
        newTechnicalInfo.backline ||
        newTechnicalInfo.soundCheck ||
        newTechnicalInfo.personnel.length > 0;

      // Only set technicalInfo and mark as unsaved if there are actual changes
      if (!isSame(technicalInfo, newTechnicalInfo)) {
        setTechnicalInfo(newTechnicalInfo);

        // Only mark as unsaved if there's actual content
        if (hasContent) {
          setHasUnsavedChanges(true);
        }
      }
    },
    [technicalInfo]
  );

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!currentUser) {
    return <Login />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="main-container">
        <div className="sidebar-container">
          <Sidebar onItemClick={handleSidebarItemClick} />
        </div>

        <Header
          items={items}
          inputOutput={inputOutput}
          technicalInfo={technicalInfo}
          onLoad={handleImport}
          currentConfigName={currentConfigName}
          currentConfigId={currentConfigId}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onNewConfig={handleNewConfig}
          handleExportPDF={handleExportPDF}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          currentHistoryIndex={currentHistoryIndex}
          historyLength={historyLength}
          onTitleChange={handleTitleChange}
          saveStatus={saveStatus}
          saveError={saveError}
        >
          <UserMenu />
        </Header>

        <div className="content-container">
          <div
            ref={stageContainerRef}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
                }}
                className="stage-container"
              >
                <Stage
                  width={1200}
                  height={800}
                  items={items}
                  onDrop={handleDrop}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onResize={handleResize}
                  onDuplicate={handleDuplicate}
                  latestItemId={latestItemId}
                  onItemSelected={handleItemSelected}
                  onImport={(importedItems) => {
                    // Use handleItemsUpdate instead of handleImport for text edits
                    handleItemsUpdate(importedItems);
                  }}
                  onExport={(handler) => {
                    console.log("Setting export handler in App");
                    exportConfigRef.current = handler;
                  }}
                  onImportFunc={(handler) => {
                    console.log("Setting import handler in App");
                    importConfigRef.current = handler;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Side Panel for Input/Output and Technical Info */}
          <SidePanel
            isOpen={isSidePanelOpen}
            onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)}
            inputOutput={inputOutput}
            onInputOutputChange={handleInputOutputChange}
            technicalInfo={technicalInfo}
            onTechnicalInfoChange={handleTechnicalInfoChange}
          />
        </div>
      </div>
      <SaveChangesDialog
        open={showSaveChangesDialog}
        onClose={handleSaveChangesDialogClose}
      />
    </DndProvider>
  );
}

export default App;

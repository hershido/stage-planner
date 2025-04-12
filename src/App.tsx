import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Stage from "./components/Stage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./components/Login";
import UserMenu from "./components/UserMenu";
import InputOutputTable from "./components/InputOutputTable";
import TechnicalInfoForm from "./components/TechnicalInfoForm";
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
  const [inputOutput, setInputOutput] = useState<StageInputOutput | undefined>(
    undefined
  );
  const [technicalInfo, setTechnicalInfo] = useState<TechnicalInfo | undefined>(
    undefined
  );
  const [isTechnicalInfoModalOpen, setIsTechnicalInfoModalOpen] =
    useState(false);

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

  // Function to handle technical info changes
  const handleTechnicalInfoChange = useCallback(
    (newTechnicalInfo: TechnicalInfo) => {
      setTechnicalInfo(newTechnicalInfo);
      setHasUnsavedChanges(true);
    },
    []
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

      // Mark as having unsaved changes unless this is the initial load
      if (!isInitialLoad) {
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

  // Handler for input/output changes
  const handleInputOutputChange = useCallback(
    (newInputOutput: StageInputOutput) => {
      setInputOutput(newInputOutput);
      setHasUnsavedChanges(true);
    },
    []
  );

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
      // Replace current items with imported ones
      setItems(importedItems);
      setLatestItemId(null); // Reset latest ID since we're loading a new config
      setCurrentConfigName(configName);
      setCurrentConfigId(configId || null);
      setHasUnsavedChanges(false);

      // Set input/output data if it exists
      setInputOutput(importedInputOutput);

      // Set technical info if it exists
      setTechnicalInfo(importedTechnicalInfo);

      // Add the imported state to history as the initial load
      addToHistory(importedItems, null, true);

      // Update last accessed timestamp if we have a config ID
      if (configId) {
        updateLastAccessed(configId);
      }
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
          }
        } catch (error) {
          console.error("Error loading latest configuration:", error);
          // Don't show an error to the user - if this fails, they'll just start with an empty stage
        }
      }
    };

    loadLatestConfig();
  }, [currentUser, handleImport]); // Re-run if the user changes or handleImport changes

  // Handler for saving current configuration
  const handleSave = useCallback(async () => {
    if (!currentUser) return;

    try {
      if (!currentConfigId || !currentConfigName) {
        console.error("Missing configuration ID or name");
        return;
      }

      console.log(`Saving configuration '${currentConfigName}'...`);
      await updateConfiguration(
        currentConfigId,
        items,
        inputOutput,
        technicalInfo
      );
      setHasUnsavedChanges(false);
      alert(`Configuration '${currentConfigName}' updated successfully!`);
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration. Please try again.");
    }
  }, [
    currentUser,
    currentConfigId,
    currentConfigName,
    items,
    inputOutput,
    technicalInfo,
  ]);

  // Handler for "Save As" to create a new configuration
  const handleSaveAs = useCallback(() => {
    // We're using the existing modal in ConfigManager for "Save As"
    // This just opens the modal - actual saving is handled in the ConfigManager component
    console.log("Opening Save As modal");
  }, []);

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
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
        });

        // Get PDF dimensions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculate the image dimensions while preserving aspect ratio
        const canvasRatio = canvas.width / canvas.height;

        // Set margins
        const margin = 10; // mm
        const maxWidth = pdfWidth - margin * 2;
        const maxHeight = pdfHeight - margin * 2;

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

        // Center vertically on the page with equal margins
        const yPos = (pdfHeight - imgHeight) / 2;

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

        // Add Technical Info to the PDF if it exists
        if (technicalInfo) {
          // Add technical info page
          pdf.addPage("", "portrait");

          // Get portrait page dimensions
          const portraitWidth = pdf.internal.pageSize.getWidth();
          let yPosition = 20; // Starting Y position

          // Add page title
          pdf.setFontSize(18);
          pdf.setTextColor(0, 0, 0);
          pdf.text("Technical Information", portraitWidth / 2, yPosition, {
            align: "center",
          });
          yPosition += 15;

          // Add project title
          if (technicalInfo.projectTitle) {
            pdf.setFontSize(16);
            pdf.text(technicalInfo.projectTitle, portraitWidth / 2, yPosition, {
              align: "center",
            });
            yPosition += 15;
          }

          // Add personnel section if exists
          if (technicalInfo.personnel && technicalInfo.personnel.length > 0) {
            pdf.setFontSize(14);
            pdf.text("Personnel", 10, yPosition);
            yPosition += 8;

            // Create personnel table
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);

            // Draw table headers
            pdf.text("Name", 10, yPosition);
            pdf.text("Role", 60, yPosition);
            pdf.text("Phone", 110, yPosition);
            pdf.text("Email", 160, yPosition);
            yPosition += 2;

            // Draw horizontal line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(10, yPosition, portraitWidth - 10, yPosition);
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(0, 0, 0);

            // Add personnel rows
            technicalInfo.personnel.forEach((person, index) => {
              pdf.text(person.name || "-", 10, yPosition);
              pdf.text(person.role || "-", 60, yPosition);
              pdf.text(person.phone || "-", 110, yPosition);
              pdf.text(person.email || "-", 160, yPosition);
              yPosition += 7;

              // Add light line after each row except the last
              if (index < technicalInfo.personnel.length - 1) {
                pdf.setDrawColor(230, 230, 230);
                pdf.line(10, yPosition - 3, portraitWidth - 10, yPosition - 3);
              }
            });

            yPosition += 10;
          }

          // Helper function to add a section with title and content
          const addSection = (title: string, content: string) => {
            if (!content) return false;

            // Check if new page is needed (less than 30mm remaining)
            if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
              pdf.addPage("", "portrait");
              yPosition = 20;
            }

            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text(title, 10, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            // Split text to fit page width and handle line breaks
            const splitText = pdf.splitTextToSize(content, portraitWidth - 20);
            pdf.text(splitText, 10, yPosition);
            yPosition += splitText.length * 5 + 10;

            return true;
          };

          // Add each section if it has content
          if (technicalInfo.generalInfo)
            addSection("General Information", technicalInfo.generalInfo);

          if (technicalInfo.houseSystem)
            addSection("House System", technicalInfo.houseSystem);

          if (technicalInfo.mixingDesk)
            addSection("Mixing Desk", technicalInfo.mixingDesk);

          if (technicalInfo.monitoring)
            addSection("Monitoring", technicalInfo.monitoring);

          if (technicalInfo.backline)
            addSection("Backline", technicalInfo.backline);

          if (technicalInfo.soundCheck)
            addSection("Sound Check", technicalInfo.soundCheck);
        }

        // Add Input/Output tables to the PDF if they exist
        if (
          inputOutput &&
          (inputOutput.inputs.length > 0 || inputOutput.outputs.length > 0)
        ) {
          // Create a new PDF in portrait orientation for the I/O tables
          // Add a new page in portrait orientation for I/O tables
          pdf.addPage("", "portrait");

          // Get portrait page dimensions
          const portraitWidth = pdf.internal.pageSize.getWidth();
          const portraitHeight = pdf.internal.pageSize.getHeight();

          let yPosition = 20; // Starting Y position with more space at top

          // Add page title
          pdf.setFontSize(16);
          pdf.text("Stage Input/Output Lists", portraitWidth / 2, yPosition, {
            align: "center",
          });
          yPosition += 15;

          // Add Input table if there are inputs
          if (inputOutput.inputs.length > 0) {
            pdf.setFontSize(14);
            pdf.text("Input List", 10, yPosition);
            yPosition += 8;

            // Set up table headers
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);

            // Draw table headers
            pdf.text("Input #", 10, yPosition);
            pdf.text("Channel Name", 30, yPosition);
            pdf.text("Mic/DI Type", 110, yPosition);
            pdf.text("Stand Type", 170, yPosition);
            yPosition += 2;

            // Draw horizontal line under headers
            pdf.setDrawColor(200, 200, 200);
            pdf.line(10, yPosition, portraitWidth - 10, yPosition);
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(0, 0, 0);

            // Add each input row
            inputOutput.inputs.forEach((input, index) => {
              pdf.text(input.number.toString(), 10, yPosition);
              pdf.text(input.name || "-", 30, yPosition);
              pdf.text(input.channelType || "-", 110, yPosition);
              pdf.text(input.standType || "-", 170, yPosition);
              yPosition += 7;

              // Add a light gray line after each row except the last
              if (index < inputOutput.inputs.length - 1) {
                pdf.setDrawColor(230, 230, 230);
                pdf.line(10, yPosition - 3, portraitWidth - 10, yPosition - 3);
              }
            });

            yPosition += 5;
          }

          // Add Output table if there are outputs and enough space
          if (inputOutput.outputs.length > 0) {
            // Check if we need a new page (if less than 50mm remaining)
            if (yPosition > portraitHeight - 50) {
              pdf.addPage("", "portrait");
              yPosition = 20;
            } else {
              yPosition += 10; // Add some spacing between tables
            }

            pdf.setFontSize(14);
            pdf.text("Output List", 10, yPosition);
            yPosition += 8;

            // Set up table headers
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);

            // Draw table headers
            pdf.text("Output #", 10, yPosition);
            pdf.text("Channel Name", 30, yPosition);
            pdf.text("Monitor Type", 130, yPosition);
            yPosition += 2;

            // Draw horizontal line under headers
            pdf.setDrawColor(200, 200, 200);
            pdf.line(10, yPosition, portraitWidth - 10, yPosition);
            yPosition += 5;

            // Reset text color
            pdf.setTextColor(0, 0, 0);

            // Add each output row
            inputOutput.outputs.forEach((output, index) => {
              pdf.text(output.number.toString(), 10, yPosition);
              pdf.text(output.name || "-", 30, yPosition);
              pdf.text(output.monitorType || "-", 130, yPosition);
              yPosition += 7;

              // Add a light gray line after each row except the last
              if (index < inputOutput.outputs.length - 1) {
                pdf.setDrawColor(230, 230, 230);
                pdf.line(10, yPosition - 3, portraitWidth - 10, yPosition - 3);
              }
            });
          }
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
          const opts = {
            suggestedName: fileName,
            types: [
              {
                description: "PDF File",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          };

          // Show the system save dialog
          // @ts-expect-error The File System Access API might not be typed
          window
            .showSaveFilePicker(opts)
            .then(async (fileHandle: FileSystemFileHandle) => {
              // Get a writable stream to the file
              const writable = await fileHandle.createWritable();
              // Write the PDF blob to the file
              await writable.write(pdfBlob);
              // Close the file and finalize it
              await writable.close();
              console.log("PDF saved successfully");
            })
            .catch((err: Error) => {
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
          handleExportPDF={handleExportPDF}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          currentHistoryIndex={currentHistoryIndex}
          historyLength={historyLength}
          openTechnicalInfo={() => setIsTechnicalInfoModalOpen(true)}
        >
          <UserMenu />
        </Header>

        <div className="content-container">
          {/* Technical Info Modal */}
          <TechnicalInfoForm
            isOpen={isTechnicalInfoModalOpen}
            onClose={() => setIsTechnicalInfoModalOpen(false)}
            technicalInfo={technicalInfo}
            onSave={handleTechnicalInfoChange}
          />

          {/* Stage container */}
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
                    // Default to empty string if no config name available when directly imported
                    handleImport(importedItems, "");
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

            <div
              className="input-output-container"
              style={{
                width: "100%",
                maxWidth: "1200px",
                backgroundColor: "transparent",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <InputOutputTable
                inputOutput={inputOutput}
                onChange={handleInputOutputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;

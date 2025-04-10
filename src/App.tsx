import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Stage from "./components/Stage";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import UserMenu from "./components/UserMenu";
import ConfigManager from "./components/ConfigManager";
import { StageItem, DraggableItem } from "./types/stage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "./context/AuthContext";
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

  // Function to add a new entry to history
  const addToHistory = useCallback(
    (newItems: StageItem[], newLatestItemId: string | null) => {
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

  const handleDrop = useCallback(
    (item: DraggableItem, position: { x: number; y: number }) => {
      console.log("handleDrop called with:", item, position);

      const timestamp = Date.now();
      const newId = `${item.name}-${timestamp}`;

      const newItem: StageItem = {
        id: newId,
        name: item.name,
        category: item.type,
        icon: item.icon,
        position,
        width: 200,
        height: 200,
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

      // Place the item at the center of the stage
      const position = {
        x: Math.max(0, stageWidth / 2 - 100), // Center X, assuming item width of 200
        y: Math.max(0, stageHeight / 2 - 100), // Center Y, assuming item height of 200
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
    (id: string, size: { width: number; height: number }) => {
      console.log("Resizing item:", id, "to", size);

      setItems((currentItems) => {
        const newItems = currentItems.map((item) => {
          if (item.id === id) {
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

  // Handler for importing stage configuration
  const handleImport = useCallback(
    (importedItems: StageItem[], configName: string) => {
      console.log(
        "Importing stage configuration with",
        importedItems.length,
        "items"
      );
      // Replace current items with imported ones
      setItems(importedItems);
      // Clear latest item ID to avoid selection issues
      setLatestItemId(null);
      // Set the current configuration name
      setCurrentConfigName(configName);

      // Add imported state to history
      addToHistory(importedItems, null);
    },
    [addToHistory]
  );

  // Function to export stage to PDF
  const handleExportPDF = useCallback(() => {
    if (!stageContainerRef.current) return;

    const stageElement = stageContainerRef.current.querySelector("#stage");
    if (!stageElement) {
      console.error("Stage element not found");
      return;
    }

    // Show a loading message
    const loadingEl = document.createElement("div");
    loadingEl.innerText = "Generating PDF...";
    loadingEl.style.position = "absolute";
    loadingEl.style.top = "50%";
    loadingEl.style.left = "50%";
    loadingEl.style.transform = "translate(-50%, -50%)";
    loadingEl.style.padding = "10px 20px";
    loadingEl.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    loadingEl.style.color = "white";
    loadingEl.style.borderRadius = "5px";
    loadingEl.style.zIndex = "1000";
    document.body.appendChild(loadingEl);

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
      scale: 2, // Higher scale for better quality
    })
      .then((canvas) => {
        // Calculate dimensions to fit the stage properly in the PDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
        });

        // Calculate the PDF dimensions based on the canvas aspect ratio
        const imgWidth = 280; // mm (A4 landscape width minus margins)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the stage image to the PDF
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

        // Add metadata
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        pdf.setFontSize(10);
        pdf.text(
          `Stage Planner - Generated on ${date} at ${time}`,
          10,
          imgHeight + 15
        );
        pdf.text(`Total items: ${items.length}`, 10, imgHeight + 20);

        // Save the PDF
        pdf.save(`stage-plan-${date.replace(/\//g, "-")}.pdf`);

        // Restore original styles
        originalStyles.forEach((item) => {
          (item.element as HTMLElement).style.cssText = item.style;
        });

        // Remove loading element
        document.body.removeChild(loadingEl);

        console.log("PDF generated successfully");
      })
      .catch((error) => {
        // Restore original styles even if there was an error
        originalStyles.forEach((item) => {
          (item.element as HTMLElement).style.cssText = item.style;
        });

        console.error("Error generating PDF:", error);
        document.body.removeChild(loadingEl);
      });
  }, [items]);

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
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar onItemClick={handleSidebarItemClick} />
        <UserMenu />
        <div
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Add control toolbar */}
          <div
            style={{
              display: "flex",
              gap: "5px",
              marginBottom: "10px",
              padding: "5px",
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 50,
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "4px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <ConfigManager
              items={items}
              onLoad={handleImport}
              currentConfigName={currentConfigName}
            />
            <button
              onClick={handleExportPDF}
              title="Export to PDF"
              style={{
                width: "30px",
                height: "30px",
                padding: "0",
                background: "#fff",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                marginRight: "10px",
              }}
            >
              📄
            </button>
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex <= 0}
              title="Undo (Cmd+Z / Ctrl+Z)"
              style={{
                width: "30px",
                height: "30px",
                padding: "0",
                background: currentHistoryIndex <= 0 ? "#f0f0f0" : "#fff",
                color: currentHistoryIndex <= 0 ? "#ccc" : "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: currentHistoryIndex <= 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              ↩
            </button>
            <button
              onClick={handleRedo}
              disabled={currentHistoryIndex >= historyLength - 1}
              title="Redo (Cmd+Shift+Z / Ctrl+Shift+Z)"
              style={{
                width: "30px",
                height: "30px",
                padding: "0",
                background:
                  currentHistoryIndex >= historyLength - 1 ? "#f0f0f0" : "#fff",
                color:
                  currentHistoryIndex >= historyLength - 1 ? "#ccc" : "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor:
                  currentHistoryIndex >= historyLength - 1
                    ? "default"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              ↪
            </button>
          </div>

          {/* Current configuration name display */}
          {currentConfigName && (
            <div
              style={{
                position: "absolute",
                top: "25px",
                left: "23%",
                transform: "translateX(-50%)",
                zIndex: 50,
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "1px",
                filter: "drop-shadow(0 0 5px rgba(255,255,255,0.3))",
              }}
            >
              {currentConfigName}
            </div>
          )}

          {/* Stage container */}
          <div
            ref={stageContainerRef}
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
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
      </div>
    </DndProvider>
  );
}

export default App;

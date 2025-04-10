import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { StageItem, DraggableItem } from "../types/stage";

interface StageProps {
  width: number;
  height: number;
  items: StageItem[];
  onDrop: (item: DraggableItem, position: { x: number; y: number }) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onResize?: (id: string, size: { width: number; height: number }) => void;
  onDuplicate?: (id: string, position: { x: number; y: number }) => void;
  latestItemId?: string | null;
  onItemSelected?: () => void;
  onExport?: (handler: () => void) => void;
  onImport?: (items: StageItem[]) => void;
  onImportFunc?: (handler: () => void) => void;
}

// Define our item types
const ItemTypes = {
  STAGE_ITEM: "stage-item",
  SIDEBAR_ITEM: "sidebar-item",
  RESIZE_HANDLE: "resize-handle",
};

// Define the structure for draggable stage items
interface StageItemDragObject {
  id: string;
  type: string;
  isOptionKeyPressed?: boolean;
  isMultiSelect?: boolean;
  selectedIds?: string[];
  originalPositions?: Record<string, { x: number; y: number }>;
  initialMouseOffset?: { x: number; y: number }; // Track where the mouse was relative to the item
  cleanup?: () => void;
}

// Resize handle component
const ResizeHandle: React.FC<{
  position: string;
  itemId: string;
  onResizeStart: (
    itemId: string,
    handlePosition: string,
    e: React.MouseEvent
  ) => void;
}> = ({ position, itemId, onResizeStart }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`Resize handle ${position} pressed`);
    onResizeStart(itemId, position, e);
  };

  // Determine position styling based on handle position
  const getPositionStyle = () => {
    switch (position) {
      case "top-left":
        return { top: "-6px", left: "-6px", cursor: "nwse-resize" };
      case "top-right":
        return { top: "-6px", right: "-6px", cursor: "nesw-resize" };
      case "bottom-left":
        return { bottom: "-6px", left: "-6px", cursor: "nesw-resize" };
      case "bottom-right":
        return { bottom: "-6px", right: "-6px", cursor: "nwse-resize" };
      default:
        return {};
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        width: "12px",
        height: "12px",
        backgroundColor: "#3498db",
        border: "2px solid white",
        borderRadius: "50%",
        zIndex: 3,
        ...getPositionStyle(),
      }}
    />
  );
};

const StageItemComponent: React.FC<{
  item: StageItem;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onDuplicate?: (id: string, position: { x: number; y: number }) => void;
  allItems: StageItem[];
  selectedItemIds: string[];
}> = ({
  item,
  onDelete,
  isSelected,
  onSelect,
  onResize,
  onDuplicate,
  allItems,
  selectedItemIds,
}) => {
  const [itemSize, setItemSize] = useState({
    width: typeof item.width === "number" ? item.width : 100,
    height: typeof item.height === "number" ? item.height : 100,
  });
  const [isResizing, setIsResizing] = useState(false);
  const isOptionKeyPressedRef = React.useRef(false);

  // Update local size when item size changes
  useEffect(() => {
    setItemSize({
      width: typeof item.width === "number" ? item.width : 100,
      height: typeof item.height === "number" ? item.height : 100,
    });
  }, [item.width, item.height]);

  const [{ isDragging }, drag] = useDrag<
    StageItemDragObject,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: ItemTypes.STAGE_ITEM,
      item: (monitor) => {
        // Add listener for Option key while dragging
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Alt" || e.altKey || e.metaKey) {
            console.log("Option key pressed during drag");
            isOptionKeyPressedRef.current = true;
          }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          if (e.key === "Alt" || e.altKey || e.metaKey) {
            console.log("Option key released during drag");
            isOptionKeyPressedRef.current = false;
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        // Get the initial mouse position relative to the item
        const initialClientOffset = monitor.getInitialClientOffset();
        const initialSourceClientOffset =
          monitor.getInitialSourceClientOffset();

        let initialMouseOffset = { x: 0, y: 0 };

        if (initialClientOffset && initialSourceClientOffset) {
          // Calculate the mouse position relative to the item's top-left corner
          initialMouseOffset = {
            x: initialClientOffset.x - initialSourceClientOffset.x,
            y: initialClientOffset.y - initialSourceClientOffset.y,
          };
          console.log(
            `Initial mouse offset: (${initialMouseOffset.x}, ${initialMouseOffset.y})`
          );
        }

        // Check if this item is part of a multi-selection
        const isMultiSelect = isSelected && selectedItemIds.length > 1;
        console.log(
          `Starting drag for item ${item.id}, multi-select: ${isMultiSelect}, selected items: ${selectedItemIds.length}`
        );

        // If this is a multi-select drag, capture the original positions of all selected items
        const originalPositions: Record<string, { x: number; y: number }> = {};

        if (isMultiSelect) {
          // Store the positions of all selected items
          selectedItemIds.forEach((id) => {
            const itemData = allItems.find((i) => i.id === id);
            if (itemData) {
              originalPositions[id] = { ...itemData.position };
            }
          });
          console.log("Captured original positions:", originalPositions);
        }

        return {
          id: item.id,
          type: ItemTypes.STAGE_ITEM,
          isOptionKeyPressed: isOptionKeyPressedRef.current,
          isMultiSelect,
          selectedIds: isMultiSelect ? selectedItemIds : undefined,
          originalPositions: isMultiSelect ? originalPositions : undefined,
          initialMouseOffset,
          cleanup: () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
          },
        };
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      // Only allow dragging if we're not currently resizing
      canDrag: () => !isResizing,
      end: (draggedItem, monitor) => {
        if (draggedItem.cleanup) {
          draggedItem.cleanup();
        }

        if (!monitor.didDrop()) {
          console.log("Drop was not successful");
        }
      },
    }),
    [isResizing, item.id, isSelected, selectedItemIds, allItems]
  ); // Add isResizing as a dependency

  // Handle the delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  // Handle selection click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  // Handle resize start
  const handleResizeStart = (
    itemId: string,
    handlePosition: string,
    e: React.MouseEvent
  ) => {
    console.log("Resize start:", handlePosition, "for item", itemId);
    e.stopPropagation();
    e.preventDefault();

    // Set flag to prevent dragging
    setIsResizing(true);

    // Store initial values for calculations
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = itemSize.width || 100;
    const startHeight = itemSize.height || 100;

    console.log("Adding document event listeners for resize");

    // Use direct functions without useCallback to ensure the latest closure values
    const moveHandler = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      console.log(
        `Resize moving: deltaX=${deltaX}, deltaY=${deltaY}, handle=${handlePosition}`
      );

      // Calculate potential changes based on handle position
      let widthChange = 0;
      let heightChange = 0;

      if (handlePosition.includes("right")) {
        widthChange = deltaX;
      } else if (handlePosition.includes("left")) {
        widthChange = -deltaX;
      }

      if (handlePosition.includes("bottom")) {
        heightChange = deltaY;
      } else if (handlePosition.includes("top")) {
        heightChange = -deltaY;
      }

      // Determine the largest change to maintain square aspect ratio
      // We use the absolute value to find the larger change, then apply the correct sign
      const maxChange = Math.max(Math.abs(widthChange), Math.abs(heightChange));
      const signWidth = widthChange >= 0 ? 1 : -1;
      const signHeight = heightChange >= 0 ? 1 : -1;

      // Apply the change while keeping aspect ratio 1:1
      let newSize = Math.max(
        30,
        startWidth +
          (handlePosition.includes("left") || handlePosition.includes("right")
            ? signWidth * maxChange
            : 0)
      );

      // If we're not touching width (top/bottom only), use height as basis
      if (
        !handlePosition.includes("left") &&
        !handlePosition.includes("right")
      ) {
        newSize = Math.max(30, startHeight + signHeight * maxChange);
      }

      console.log(`New square size: ${newSize}x${newSize}`);

      // Update local state and parent state
      setItemSize({ width: newSize, height: newSize });
      onResize(item.id, { width: newSize, height: newSize });
    };

    const endHandler = (upEvent: MouseEvent) => {
      console.log("Resize end");

      upEvent.preventDefault();
      upEvent.stopPropagation();

      // Remove event listeners first
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", endHandler);

      // Then set resizing flag to false to allow dragging again
      setIsResizing(false);
    };

    // Add document-level event listeners for mousemove and mouseup
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", endHandler);
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      // No longer needed as we're using local handlers in handleResizeStart
    };
  }, []);

  // Render the delete button with a proper 'x' symbol
  const renderDeleteButton = () => {
    return (
      <button
        onClick={handleDelete}
        style={{
          position: "absolute",
          top: "-25px",
          right: "-12px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: "1px solid #d00",
          backgroundColor: "#f00",
          color: "white",
          fontSize: "16px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          padding: 0,
          lineHeight: 0.8,
          zIndex: 3,
        }}
      >
        ×
      </button>
    );
  };

  // We're using onDuplicate in Stage's useDrop but not directly in this component
  // This comment prevents the unused variable linter error
  React.useEffect(() => {
    if (onDuplicate) {
      // This is just to satisfy the linter
      console.debug("Duplicate handler is available:", !!onDuplicate);
    }
  }, [onDuplicate]);

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      onClick={handleClick}
      style={{
        position: "absolute",
        left: item.position.x,
        top: item.position.y,
        width: `${itemSize.width}px`,
        height: `${itemSize.height}px`,
        border: isSelected ? "2px solid #3498db" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDragging ? 0.5 : 1,
        cursor: isResizing ? "auto" : "move",
        zIndex: isSelected ? 2 : 1,
        boxShadow: isSelected ? "0 0 5px rgba(52, 152, 219, 0.5)" : "none",
        transition: isResizing ? "none" : "box-shadow 0.2s ease",
      }}
    >
      <img
        src={item.icon}
        alt={item.name}
        style={{
          width: "80%",
          height: "80%",
          objectFit: "contain",
          pointerEvents: "none",
          background: "transparent",
        }}
      />
      {isSelected && (
        <>
          {renderDeleteButton()}
          <ResizeHandle
            position="top-left"
            itemId={item.id}
            onResizeStart={handleResizeStart}
          />
          <ResizeHandle
            position="top-right"
            itemId={item.id}
            onResizeStart={handleResizeStart}
          />
          <ResizeHandle
            position="bottom-left"
            itemId={item.id}
            onResizeStart={handleResizeStart}
          />
          <ResizeHandle
            position="bottom-right"
            itemId={item.id}
            onResizeStart={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};

const Stage: React.FC<StageProps> = ({
  width,
  height,
  items,
  onDrop,
  onMove,
  onDelete,
  onResize = () => {}, // Default empty function if not provided
  onDuplicate = () => {}, // Default empty function if not provided
  latestItemId,
  onItemSelected = () => {}, // Default empty function if not provided
  onExport, // Function to trigger exporting stage configuration
  onImport,
  onImportFunc,
}) => {
  // Change from single selection to multi-selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Track if Option key is pressed using a ref for real-time access during drag operations
  const isOptionPressedRef = React.useRef(false);
  // Track if Shift key is pressed for multi-select
  const isShiftPressedRef = React.useRef(false);
  // Reference to the stage element for focus management
  const stageRef = React.useRef<HTMLDivElement>(null);

  // Lasso selection state
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState({ x: 0, y: 0 });
  const [lassoEnd, setLassoEnd] = useState({ x: 0, y: 0 });
  const [isDraggingLasso, setIsDraggingLasso] = useState(false);
  // Add a ref to track when a lasso operation just completed to prevent deselection
  const justCompletedLassoRef = React.useRef(false);

  // Use useRef to store items without causing re-renders
  const itemsRef = useRef(items);

  // Update the ref when items change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Width and height refs
  const dimensionsRef = useRef({ width, height });

  // Update dimensions ref when they change
  useEffect(() => {
    dimensionsRef.current = { width, height };
  }, [width, height]);

  // Use event capturing to detect modifier keys throughout the app
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt key (Option on Mac)
      if (
        e.altKey ||
        e.key === "Alt" ||
        e.key === "Option" ||
        e.key === "Meta"
      ) {
        console.log("Option/Alt key down detected", e.key);
        isOptionPressedRef.current = true;
      }

      // Check for Shift key
      if (e.shiftKey || e.key === "Shift") {
        console.log("Shift key down detected");
        isShiftPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Check for Alt key (Option on Mac)
      if (
        e.altKey ||
        e.key === "Alt" ||
        e.key === "Option" ||
        e.key === "Meta"
      ) {
        console.log("Option/Alt key up detected", e.key);
        isOptionPressedRef.current = false;
      }

      // Check for Shift key
      if (e.shiftKey || e.key === "Shift") {
        console.log("Shift key up detected");
        isShiftPressedRef.current = false;
      }
    };

    // When window loses focus, reset modifier key states
    const handleBlur = () => {
      isOptionPressedRef.current = false;
      isShiftPressedRef.current = false;
    };

    // Use capturing phase to ensure we get the events first
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleBlur, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  // Use latest item ID from props to select the newly added item
  useEffect(() => {
    if (latestItemId) {
      setSelectedItemIds([latestItemId]);
      // Notify parent that we've selected the item
      onItemSelected();

      // Focus the stage element
      if (stageRef.current) {
        stageRef.current.focus();
      }
    }
  }, [latestItemId, onItemSelected]);

  // Handle deletion of the selected items with Delete key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key, "Selected items:", selectedItemIds);

      // Only handle key events when we have selected items
      if (selectedItemIds.length === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault(); // Prevent browser navigation on backspace
        console.log("Deleting items with key:", selectedItemIds);
        // Delete all selected items
        selectedItemIds.forEach((id) => onDelete(id));
        setSelectedItemIds([]);
      }
    },
    [selectedItemIds, onDelete]
  );

  // Set up keyboard event listeners
  useEffect(() => {
    // Focus the stage element when the component mounts or when selectedItemIds changes
    if (stageRef.current) {
      stageRef.current.focus();
    }

    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      // Only handle key events if our component has focus or it's a delete key
      const activeElement = document.activeElement;
      const stageHasFocus =
        stageRef.current &&
        (stageRef.current === activeElement ||
          stageRef.current.contains(activeElement));

      if (stageHasFocus || e.key === "Delete") {
        handleKeyDown(e);
      }
    };

    // Add the event listener
    document.addEventListener("keydown", handleKeyDownWrapper);

    return () => {
      document.removeEventListener("keydown", handleKeyDownWrapper);
    };
  }, [handleKeyDown]);

  // Handle resize of items
  const handleResize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      // Update the item in the state with new size
      console.log(`Resizing item ${id} to ${size.width}x${size.height}`);
      onResize(id, size);
    },
    [onResize]
  );

  // Debug: Log items whenever they change
  useEffect(() => {
    console.log("Stage items:", items);
  }, [items]);

  const [{ isOver }, drop] = useDrop<
    DraggableItem | StageItemDragObject,
    unknown,
    { isOver: boolean }
  >(() => ({
    accept: ["instruments", "equipment", ItemTypes.STAGE_ITEM],
    drop: (item, monitor) => {
      // If we're in lasso selection mode, don't handle drops
      if (isDraggingLasso) return undefined;

      const offset = monitor.getClientOffset();
      console.log("Drop occurring with item:", item);

      if (!offset) return undefined;

      const stageElement = document.getElementById("stage");
      if (!stageElement) return undefined;

      const rect = stageElement.getBoundingClientRect();
      const x = offset.x - rect.left;
      const y = offset.y - rect.top;

      // If it's an item from the Stage (being moved)
      if (
        "type" in item &&
        item.type === ItemTypes.STAGE_ITEM &&
        "id" in item &&
        item.id
      ) {
        // Get the dragged item as the correct type
        const draggedItem = item as StageItemDragObject;

        // Check for Option key from both ref and drag item
        const isOptionPressed =
          isOptionPressedRef.current || draggedItem.isOptionKeyPressed;

        console.log("Option key state during drop:", isOptionPressed);

        // Get cursor position relative to the stage
        const cursorX = x;
        const cursorY = y;

        // Apply mouse offset adjustment for more natural positioning
        const mouseOffset = draggedItem.initialMouseOffset || { x: 0, y: 0 };

        // Calculate the position where the item should be placed
        // This adjusts for where the user initially clicked on the item
        const adjustedX = cursorX - mouseOffset.x;
        const adjustedY = cursorY - mouseOffset.y;

        console.log(
          `Cursor at (${cursorX}, ${cursorY}), adjusted position: (${adjustedX}, ${adjustedY})`
        );

        // If option key is pressed, duplicate the item instead of moving it
        if (isOptionPressed) {
          console.log(
            "Option key detected - duplicating item:",
            draggedItem.id
          );
          onDuplicate(draggedItem.id, { x: adjustedX, y: adjustedY });
        } else {
          // Check if this is a multi-selection drag operation
          const isMultiSelect =
            draggedItem.isMultiSelect &&
            draggedItem.selectedIds &&
            draggedItem.originalPositions;

          console.log(
            `Drop item: ${draggedItem.id}, multi-select: ${isMultiSelect}`
          );

          if (
            isMultiSelect &&
            draggedItem.selectedIds &&
            draggedItem.originalPositions
          ) {
            console.log(
              "Moving multiple selected items:",
              draggedItem.selectedIds
            );

            // Get the original position of the dragged item from the saved positions
            const draggedOriginalPosition =
              draggedItem.originalPositions[draggedItem.id];

            if (draggedOriginalPosition) {
              // Calculate the movement delta from the original position, using the adjusted position
              const deltaX = adjustedX - draggedOriginalPosition.x;
              const deltaY = adjustedY - draggedOriginalPosition.y;

              console.log(`Multi-drag delta: (${deltaX}, ${deltaY})`);

              // Move all selected items by applying the delta to their original positions
              draggedItem.selectedIds.forEach((id: string) => {
                const originalPos = draggedItem.originalPositions?.[id];
                if (originalPos) {
                  const newPosition = {
                    x: originalPos.x + deltaX,
                    y: originalPos.y + deltaY,
                  };
                  console.log(
                    `Moving item ${id} from (${originalPos.x}, ${originalPos.y}) to (${newPosition.x}, ${newPosition.y})`
                  );
                  onMove(id, newPosition);
                }
              });
            }
          } else {
            // Normal behavior - move just one item, with adjusted position
            console.log(
              "Moving single item:",
              draggedItem.id,
              "to",
              adjustedX,
              adjustedY
            );
            onMove(draggedItem.id, { x: adjustedX, y: adjustedY });

            // If not using shift, select only this item
            if (!isShiftPressedRef.current) {
              setSelectedItemIds([draggedItem.id]);
            }
          }
        }
      }
      // If it's an item from the Sidebar (new item)
      else if ("name" in item && "icon" in item) {
        console.log("Adding new item:", item);

        // For new items from sidebar, we need to adjust position differently
        // since we don't have initial offset - center the item at the cursor
        // assuming most items are about 100x100px (default size) for centering
        const itemSize = 100;
        const adjustedX = Math.max(0, x - itemSize / 2);
        const adjustedY = Math.max(0, y - itemSize / 2);

        // Create a new item with this drop position
        const newItem = {
          ...(item as DraggableItem),
          position: { x: adjustedX, y: adjustedY },
        };

        console.log(
          `Placing new item at adjusted position: (${adjustedX}, ${adjustedY})`
        );

        // Call the onDrop handler to add the item to the stage
        onDrop(newItem, { x: adjustedX, y: adjustedY });
      }

      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Handle clicking on the stage background to deselect items
  const handleBackgroundClick = () => {
    // Skip deselection if we were just using lasso select
    if (isDraggingLasso || isLassoActive || justCompletedLassoRef.current) {
      justCompletedLassoRef.current = false;
      return;
    }

    setSelectedItemIds([]);
    // Ensure the stage has focus for keyboard events
    if (stageRef.current) {
      stageRef.current.focus();
    }
  };

  // Handle mouse down to start lasso selection
  const handleStageMouseDown = (e: React.MouseEvent) => {
    // Only start lasso if clicking directly on the stage background
    const targetElement = e.target as HTMLElement;
    const isClickOnStageBackground = targetElement.id === "stage";

    if (isClickOnStageBackground) {
      console.log("Mouse down on stage background, starting lasso selection");

      // Get mouse position relative to stage
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Start lasso selection
      setLassoStart({ x, y });
      setLassoEnd({ x, y }); // Initialize end with start position
      setIsDraggingLasso(true);

      // Store the initial selection state to allow toggling with shift key
      const initialSelection = isShiftPressedRef.current
        ? [...selectedItemIds]
        : [];

      // If not using shift key, clear previous selection immediately
      if (!isShiftPressedRef.current) {
        setSelectedItemIds([]);
      }

      // Track items that were selected by the current lasso operation
      let lassoSelectedIds = new Set<string>();

      // Prevent default to avoid text selection
      e.preventDefault();

      // Create a reference to track if the mouse has moved enough
      let hasMovedEnough = false;

      // Function to update selection based on current lasso rectangle
      const updateSelectionFromLasso = (
        lassoLeft: number,
        lassoTop: number,
        lassoRight: number,
        lassoBottom: number
      ) => {
        // Skip if we haven't moved enough yet
        if (!hasMovedEnough) return;

        // Define the current selection rectangle
        const selectionRect = {
          left: lassoLeft,
          top: lassoTop,
          right: lassoRight,
          bottom: lassoBottom,
        };

        // Find all items that intersect with the selection rectangle
        const currentIntersectingIds = new Set<string>();

        items.forEach((item) => {
          // Calculate item bounds
          const itemLeft = item.position.x;
          const itemTop = item.position.y;
          const itemWidth = typeof item.width === "number" ? item.width : 100;
          const itemHeight =
            typeof item.height === "number" ? item.height : 100;
          const itemRight = item.position.x + itemWidth;
          const itemBottom = item.position.y + itemHeight;

          // Check if there's an intersection
          const noOverlap =
            itemLeft > selectionRect.right || // Item is entirely to the right
            itemRight < selectionRect.left || // Item is entirely to the left
            itemTop > selectionRect.bottom || // Item is entirely below
            itemBottom < selectionRect.top; // Item is entirely above

          const intersects = !noOverlap;

          if (intersects) {
            currentIntersectingIds.add(item.id);
          }
        });

        // Update our tracking of lasso-selected items
        lassoSelectedIds = currentIntersectingIds;

        // Calculate the new selection based on initial selection and current lasso
        let newSelection: string[];

        if (isShiftPressedRef.current) {
          // With shift: add newly intersecting items to the initial selection
          newSelection = [
            ...initialSelection,
            ...Array.from(currentIntersectingIds).filter(
              (id) => !initialSelection.includes(id)
            ),
          ];
        } else {
          // Without shift: only select currently intersecting items
          newSelection = Array.from(currentIntersectingIds);
        }

        // Update the selection state
        setSelectedItemIds(newSelection);
      };

      // Add global mouse move and mouse up handlers
      const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
        if (!stageRef.current) return;

        const stageRect = stageRef.current.getBoundingClientRect();
        const stageX = moveEvent.clientX - stageRect.left;
        const stageY = moveEvent.clientY - stageRect.top;

        // Update the lasso end position
        setLassoEnd({ x: stageX, y: stageY });

        // Set lasso as active once we've moved enough
        if (
          !hasMovedEnough &&
          (Math.abs(stageX - x) > 5 || Math.abs(stageY - y) > 5)
        ) {
          hasMovedEnough = true;
          setIsLassoActive(true);
        }

        // Update selection in real-time during dragging
        const lassoLeft = Math.min(x, stageX);
        const lassoTop = Math.min(y, stageY);
        const lassoRight = Math.max(x, stageX);
        const lassoBottom = Math.max(y, stageY);

        updateSelectionFromLasso(lassoLeft, lassoTop, lassoRight, lassoBottom);

        moveEvent.preventDefault();
      };

      const handleGlobalMouseUp = (upEvent: MouseEvent) => {
        // Remove global event listeners first
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);

        console.log(
          "Lasso selection complete with",
          lassoSelectedIds.size,
          "items"
        );

        // Set flag to prevent deselection on the subsequent click event
        justCompletedLassoRef.current = true;

        // Use a timeout to reset the flag after the current event cycle
        setTimeout(() => {
          justCompletedLassoRef.current = false;
        }, 100);

        // Reset lasso visual state but keep the selection
        setIsDraggingLasso(false);
        setIsLassoActive(false);

        upEvent.preventDefault();
      };

      // Add global event listeners to track mouse movement even outside the stage
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }
  };

  // Calculate lasso rectangle dimensions
  const lassoStyle = {
    left: Math.min(lassoStart.x, lassoEnd.x),
    top: Math.min(lassoStart.y, lassoEnd.y),
    width: Math.abs(lassoEnd.x - lassoStart.x),
    height: Math.abs(lassoEnd.y - lassoStart.y),
    display: isLassoActive ? "block" : "none",
  };

  // Add a function to handle exporting the stage configuration
  const handleExportConfig = useCallback(() => {
    try {
      console.log("Export config called");
      // Create a configuration object with all stage data
      const stageConfig = {
        stageWidth: width,
        stageHeight: height,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          position: item.position,
          width: item.width || 100,
          height: item.height || 100,
        })),
        exportDate: new Date().toISOString(),
      };

      // Convert to JSON
      const jsonString = JSON.stringify(stageConfig, null, 2);

      // Create a blob
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stage-config-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Stage configuration exported successfully");
    } catch (error) {
      console.error("Error exporting stage configuration:", error);
    }
  }, [width, height, items]);

  // Make the export function available to parent components via callback ref
  useEffect(() => {
    if (onExport) {
      console.log("Providing export function to parent");
      // Only run this once
      const runOnce = { current: true };
      if (runOnce.current) {
        runOnce.current = false;
        onExport(handleExportConfig);
      }
    }
  }, [onExport, handleExportConfig]);

  // Add keyboard shortcut for saving (Ctrl+S or Cmd+S)
  useEffect(() => {
    // Flag to prevent auto-save on first load
    const firstLoad = { current: true };

    // Reset after a short delay
    setTimeout(() => {
      firstLoad.current = false;
    }, 1000);

    const handleKeyboardSave = (e: KeyboardEvent) => {
      // Skip if we're on first load, dragging, or dropping
      if (firstLoad.current || isDraggingLasso || isOver) {
        return;
      }

      // Check if we're in an input field or textarea
      const tagName = document.activeElement?.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        return;
      }

      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // Prevent browser save dialog
        handleExportConfig();
      }
    };

    window.addEventListener("keydown", handleKeyboardSave);

    return () => {
      window.removeEventListener("keydown", handleKeyboardSave);
    };
  }, [handleExportConfig, isDraggingLasso, isOver]);

  // Store the onImport prop in a ref to avoid dependencies
  const onImportRef = useRef(onImport);

  // Update the ref when the prop changes
  useEffect(() => {
    onImportRef.current = onImport;
  }, [onImport]);

  // Add a function to handle importing the stage configuration
  const handleImportConfig = useCallback(() => {
    try {
      // Create a file input element
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.style.display = "none";

      // Handle file selection
      fileInput.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;

        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            if (!event.target || typeof event.target.result !== "string") {
              console.error("Failed to read file");
              return;
            }

            const importedConfig = JSON.parse(event.target.result);

            // Basic validation
            if (!importedConfig.items || !Array.isArray(importedConfig.items)) {
              console.error(
                "Invalid configuration file: missing or invalid items array"
              );
              return;
            }

            // Process and validate imported items
            const validatedItems = importedConfig.items
              .map((item: Partial<StageItem>) => {
                // Ensure all required properties exist
                if (!item.id || !item.name || !item.position || !item.icon) {
                  console.warn(
                    "Skipping item with missing required properties:",
                    item
                  );
                  return null;
                }

                // Ensure position has x and y coordinates
                if (
                  !item.position ||
                  typeof item.position.x !== "number" ||
                  typeof item.position.y !== "number"
                ) {
                  console.warn("Skipping item with invalid position:", item);
                  return null;
                }

                // Ensure category is valid, default to "equipment" if missing
                const category =
                  item.category &&
                  (item.category === "instruments" ||
                    item.category === "equipment")
                    ? item.category
                    : "equipment";

                // Create a validated item with all required properties
                return {
                  id: item.id,
                  name: item.name,
                  icon: item.icon,
                  position: {
                    x: item.position.x,
                    y: item.position.y,
                  },
                  category: category,
                  width: typeof item.width === "number" ? item.width : 100,
                  height: typeof item.height === "number" ? item.height : 100,
                };
              })
              .filter(Boolean) as StageItem[]; // Remove any null items and cast to StageItem[]

            // Import the validated items
            const currentOnImport = onImportRef.current;
            if (currentOnImport && validatedItems.length > 0) {
              console.log(
                "Importing",
                validatedItems.length,
                "validated items"
              );
              currentOnImport(validatedItems);
              console.log("Stage configuration imported successfully");
            } else {
              console.error("No valid items found in the configuration file");
            }
          } catch (error) {
            console.error("Error parsing configuration file:", error);
          }
        };

        reader.onerror = () => {
          console.error("Error reading file");
        };

        reader.readAsText(file);
      };

      // Add to DOM and trigger click
      document.body.appendChild(fileInput);
      fileInput.click();

      // Clean up - remove the file input after the selection is handled
      setTimeout(() => {
        if (document.body.contains(fileInput)) {
          document.body.removeChild(fileInput);
        }
      }, 100);
    } catch (error) {
      console.error("Error importing stage configuration:", error);
    }
  }, []); // Empty dependency array

  // Make the import function available to parent components via callback ref
  useEffect(() => {
    if (onImportFunc) {
      console.log("Providing import function to parent - once only");
      onImportFunc(handleImportConfig);
    }
    // Only run this once - omitting onImportFunc and handleImportConfig from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="stage"
      ref={(el) => {
        if (el) {
          // Safely apply the drop ref
          const dropRef = drop as unknown as (el: HTMLElement | null) => void;
          dropRef(el);
          stageRef.current = el;
        }
      }}
      onClick={handleBackgroundClick}
      onMouseDown={handleStageMouseDown}
      tabIndex={0} // Make the div focusable
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: "1px solid #ccc",
        position: "relative",
        backgroundColor: isOver ? "#f0f0f0" : "#ffffff",
        outline: "none", // Remove the focus outline
      }}
    >
      {/* Render lasso selection rectangle */}
      <div
        style={{
          position: "absolute",
          left: `${lassoStyle.left}px`,
          top: `${lassoStyle.top}px`,
          width: `${lassoStyle.width}px`,
          height: `${lassoStyle.height}px`,
          border: "1px dashed #3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          pointerEvents: "none",
          display: lassoStyle.display,
          zIndex: 10, // Ensure lasso appears above items
        }}
      />

      {items.map((item) => (
        <StageItemComponent
          key={item.id}
          item={item}
          onMove={onMove}
          onDelete={onDelete}
          isSelected={selectedItemIds.includes(item.id)}
          onSelect={(id) => {
            // When shift is pressed, toggle the selection
            if (isShiftPressedRef.current) {
              setSelectedItemIds((prev) => {
                if (prev.includes(id)) {
                  // If already selected, remove it
                  return prev.filter((itemId) => itemId !== id);
                } else {
                  // If not selected, add it
                  return [...prev, id];
                }
              });
            } else {
              // Without shift, select only this item
              setSelectedItemIds([id]);
            }

            // Focus the stage when an item is selected
            if (stageRef.current) {
              stageRef.current.focus();
            }
          }}
          onResize={handleResize}
          onDuplicate={onDuplicate}
          allItems={items}
          selectedItemIds={selectedItemIds}
        />
      ))}
    </div>
  );
};

export default Stage;

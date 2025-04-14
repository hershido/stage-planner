import React, { useState, useEffect, useCallback, useRef } from "react";
import { StageInputOutput, InputRow, OutputRow } from "../types/stage";
import { v4 as uuidv4 } from "uuid";
import { useDrag, useDrop, DndProvider, DropTargetMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Define the item types for drag-and-drop
const ItemTypes = {
  INPUT_ROW: "input_row",
  OUTPUT_ROW: "output_row",
};

interface InputOutputTableProps {
  inputOutput: StageInputOutput | undefined;
  onChange: (inputOutput: StageInputOutput) => void;
}

// Predefined options for MIC/DI type dropdown
const micDiOptions = [
  "Shure SM58",
  "Shure SM57",
  "DI",
  "Stereo DI",
  "Shure Beta 58",
  "Shure Beta 57",
  "Shure Beta 52",
  "Audix D6",
  "Sennheiser e609",
  "Sennheiser e906",
  "Sennheiser MD421",
  "Shure SM81",
  "Shure Beta 91",
  "Shure Beta 98",
  "AKG C414",
  "Neumann KM184",
  "Sennheiser MD441",
  "Audio-Technica AT4050",
  "Neumann U87",
];

// Predefined options for monitor type dropdown
const monitorOptions = [
  "Wedge",
  "Side Fill",
  "Drum Fill",
  "IEM",
  "Hot Spot",
  "Floor Monitor",
  "Headphones",
];

// Predefined options for stand type dropdown
const standOptions = ["Standard", "Baby", "Short boom", "Tall boom", "Clip-on"];

// Custom dropdown component that allows free text input
const ComboBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsFiltering(true);
  };

  // Handle blur event to update parent component
  const handleBlur = () => {
    // Only update and close the dropdown if we're not in the middle of selecting an option
    if (!isSelecting) {
      setIsEditing(false);
      setIsFiltering(false);
      onChange(inputValue);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setIsSelecting(true);
    setInputValue(option);
    onChange(option);
    setIsEditing(false);
    setIsFiltering(false);
    // Reset the selecting flag after a short delay
    setTimeout(() => {
      setIsSelecting(false);
    }, 100);
  };

  return (
    <div className="combo-box">
      {isEditing ? (
        <div className="combo-box-editing">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoFocus
            style={{
              width: "100%",
              background: "transparent",
              color: "white",
              border: "none",
              borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "6px 0",
              outline: "none",
            }}
          />
          <div
            className="dropdown-options"
            style={{
              position: "absolute",
              zIndex: 1000,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {options
              .filter(
                (option) =>
                  !isFiltering ||
                  option.toLowerCase().includes(inputValue.toLowerCase())
              )
              .map((option) => (
                <div
                  key={option}
                  className="dropdown-option"
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseDown={(e) => {
                    // Prevent the blur event from firing before selection
                    e.preventDefault();
                    handleOptionSelect(option);
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {option}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div
          className="combo-box-display"
          onClick={() => setIsEditing(true)}
          style={{
            cursor: "pointer",
            width: "100%",
            padding: "6px 0",
            color: "white",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
};

// Define interfaces for drag items
interface InputDragItem {
  index: number;
  id: string;
  type: string;
}

interface OutputDragItem {
  index: number;
  id: string;
  type: string;
}

// Create a draggable input row component
interface DraggableInputRowProps {
  input: InputRow;
  index: number;
  id: string;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  handleInputChange: (
    id: string,
    field: keyof InputRow,
    value: string | number
  ) => void;
  deleteInputRow: (id: string) => void;
  insertInputRow: (index: number) => void;
}

const DraggableInputRow = ({
  input,
  index,
  id,
  moveRow,
  handleInputChange,
  deleteInputRow,
  insertInputRow,
}: DraggableInputRowProps) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ handlerId }, drop] = useDrop<
    InputDragItem,
    void,
    { handlerId: string | symbol | null }
  >({
    accept: ItemTypes.INPUT_ROW,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: InputDragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveRow(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag<
    InputDragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: ItemTypes.INPUT_ROW,
    item: () => {
      return { id, index, type: ItemTypes.INPUT_ROW };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <tr
      ref={ref}
      style={{
        backgroundColor: "transparent",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative",
        opacity,
        cursor: "move",
      }}
      data-handler-id={handlerId}
    >
      <td style={{ padding: "10px" }}>
        <input
          type="text"
          value={input.number}
          onChange={(e) => {
            handleInputChange(input.id, "number", e.target.value);
          }}
          style={{
            width: "90%",
            padding: "6px",
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "0",
          }}
        />
      </td>
      <td style={{ padding: "10px" }}>
        <input
          type="text"
          value={input.name}
          onChange={(e) => {
            handleInputChange(input.id, "name", e.target.value);
          }}
          placeholder="Enter channel name"
          style={{
            width: "95%",
            padding: "6px",
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "0",
          }}
        />
      </td>
      <td style={{ padding: "10px" }}>
        <ComboBox
          value={input.channelType}
          onChange={(value) => {
            handleInputChange(input.id, "channelType", value);
          }}
          options={micDiOptions}
          placeholder="Mic/DI type"
        />
      </td>
      <td style={{ padding: "10px" }}>
        <ComboBox
          value={input.standType}
          onChange={(value) => {
            handleInputChange(input.id, "standType", value);
          }}
          options={standOptions}
          placeholder="Stand type"
        />
      </td>
      <td style={{ padding: "10px", textAlign: "center" }}>
        <button
          onClick={() => deleteInputRow(input.id)}
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            padding: "6px 12px",
            borderRadius: "0",
            cursor: "pointer",
            transition: "background-color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Delete row"
        >
          🗑️
        </button>
      </td>
      <div
        className="insert-row-button"
        onClick={() => insertInputRow(index)}
        title="Insert row below"
      >
        <svg viewBox="0 0 24 24">
          <line x1="12" y1="6" x2="12" y2="18" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </div>
    </tr>
  );
};

// Create a draggable output row component
interface DraggableOutputRowProps {
  output: OutputRow;
  index: number;
  id: string;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  handleOutputChange: (
    id: string,
    field: keyof OutputRow,
    value: string | number
  ) => void;
  deleteOutputRow: (id: string) => void;
  insertOutputRow: (index: number) => void;
}

const DraggableOutputRow = ({
  output,
  index,
  id,
  moveRow,
  handleOutputChange,
  deleteOutputRow,
  insertOutputRow,
}: DraggableOutputRowProps) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ handlerId }, drop] = useDrop<
    OutputDragItem,
    void,
    { handlerId: string | symbol | null }
  >({
    accept: ItemTypes.OUTPUT_ROW,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: OutputDragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveRow(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag<
    OutputDragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: ItemTypes.OUTPUT_ROW,
    item: () => {
      return { id, index, type: ItemTypes.OUTPUT_ROW };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <tr
      ref={ref}
      style={{
        backgroundColor: "transparent",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative",
        opacity,
        cursor: "move",
      }}
      data-handler-id={handlerId}
    >
      <td style={{ padding: "10px" }}>
        <input
          type="text"
          value={output.number}
          onChange={(e) => {
            handleOutputChange(output.id, "number", e.target.value);
          }}
          style={{
            width: "90%",
            padding: "6px",
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "0",
          }}
        />
      </td>
      <td style={{ padding: "10px" }}>
        <input
          type="text"
          value={output.name}
          onChange={(e) => {
            handleOutputChange(output.id, "name", e.target.value);
          }}
          placeholder="Enter channel name"
          style={{
            width: "95%",
            padding: "6px",
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "0",
          }}
        />
      </td>
      <td style={{ padding: "10px" }}>
        <ComboBox
          value={output.monitorType}
          onChange={(value) => {
            handleOutputChange(output.id, "monitorType", value);
          }}
          options={monitorOptions}
          placeholder="Monitor type"
        />
      </td>
      <td style={{ padding: "10px", textAlign: "center" }}>
        <button
          onClick={() => deleteOutputRow(output.id)}
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            padding: "6px 12px",
            borderRadius: "0",
            cursor: "pointer",
            transition: "background-color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Delete row"
        >
          🗑️
        </button>
      </td>
      <div
        className="insert-row-button"
        onClick={() => insertOutputRow(index)}
        title="Insert row below"
      >
        <svg viewBox="0 0 24 24">
          <line x1="12" y1="6" x2="12" y2="18" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </div>
    </tr>
  );
};

const InputOutputTable: React.FC<InputOutputTableProps> = ({
  inputOutput,
  onChange,
}) => {
  const [inputs, setInputs] = useState<InputRow[]>([]);
  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Initialize with default values or from props
  useEffect(() => {
    if (inputOutput) {
      // Ensure inputs and outputs are arrays
      const safeInputs = Array.isArray(inputOutput.inputs)
        ? inputOutput.inputs
        : [];
      const safeOutputs = Array.isArray(inputOutput.outputs)
        ? inputOutput.outputs
        : [];

      // Set the inputs/outputs with safety checks
      setInputs(
        safeInputs.map((input) => ({
          ...input,
          number: input.number?.toString() || "1",
        }))
      );

      setOutputs(
        safeOutputs.map((output) => ({
          ...output,
          number: output.number?.toString() || "1",
        }))
      );
    } else {
      // Initialize with one empty row for each section
      setInputs([
        {
          id: uuidv4(),
          number: "1",
          name: "",
          channelType: "",
          standType: "",
        },
      ]);
      setOutputs([
        {
          id: uuidv4(),
          number: "1",
          name: "",
          channelType: "",
          monitorType: "",
        },
      ]);
    }
    setIsInitialRender(false);
  }, [inputOutput]);

  // Debounced update to prevent too many calls to parent
  const debouncedOnChange = useCallback(() => {
    const timeoutId = setTimeout(() => {
      onChange({ inputs, outputs });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputs, outputs, onChange]);

  // Update parent component when inputs or outputs change
  useEffect(() => {
    if (!isInitialRender) {
      const cleanup = debouncedOnChange();
      return cleanup;
    }
  }, [inputs, outputs, debouncedOnChange, isInitialRender]);

  // Handle input row changes
  const handleInputChange = (
    id: string,
    field: keyof InputRow,
    value: string | number
  ) => {
    setInputs((prev) =>
      prev.map((input) => {
        if (input.id === id) {
          // Ensure number field is always a string
          if (field === "number") {
            return { ...input, [field]: String(value) };
          }
          return { ...input, [field]: value };
        }
        return input;
      })
    );
  };

  // Handle output row changes
  const handleOutputChange = (
    id: string,
    field: keyof OutputRow,
    value: string | number
  ) => {
    setOutputs((prev) =>
      prev.map((output) => {
        if (output.id === id) {
          // Ensure number field is always a string
          if (field === "number") {
            return { ...output, [field]: String(value) };
          }
          return { ...output, [field]: value };
        }
        return output;
      })
    );
  };

  // Add a new input row
  const addInputRow = () => {
    const newInput: InputRow = {
      id: uuidv4(),
      number: String(inputs.length + 1),
      name: "",
      channelType: "",
      standType: "",
    };
    setInputs((prev) => [...prev, newInput]);
  };

  // Add a new input row at a specific index
  const insertInputRow = (index: number) => {
    const newInput: InputRow = {
      id: uuidv4(),
      number: "", // Will be renumbered after insertion
      name: "",
      channelType: "",
      standType: "",
    };

    setInputs((prev) => {
      // Insert the new row at the specified index
      const newInputs = [
        ...prev.slice(0, index + 1),
        newInput,
        ...prev.slice(index + 1),
      ];

      // Renumber all rows
      return newInputs.map((input, idx) => ({
        ...input,
        number: String(idx + 1),
      }));
    });
  };

  // Add a new output row
  const addOutputRow = () => {
    const newOutput: OutputRow = {
      id: uuidv4(),
      number: String(outputs.length + 1),
      name: "",
      channelType: "",
      monitorType: "",
    };
    setOutputs((prev) => [...prev, newOutput]);
  };

  // Add a new output row at a specific index
  const insertOutputRow = (index: number) => {
    const newOutput: OutputRow = {
      id: uuidv4(),
      number: "", // Will be renumbered after insertion
      name: "",
      channelType: "",
      monitorType: "",
    };

    setOutputs((prev) => {
      // Insert the new row at the specified index
      const newOutputs = [
        ...prev.slice(0, index + 1),
        newOutput,
        ...prev.slice(index + 1),
      ];

      // Renumber all rows
      return newOutputs.map((output, idx) => ({
        ...output,
        number: String(idx + 1),
      }));
    });
  };

  // Delete an input row
  const deleteInputRow = (id: string) => {
    setInputs((prev) => {
      const newInputs = prev.filter((input) => input.id !== id);
      // Renumber the inputs
      return newInputs.map((input, index) => ({
        ...input,
        number: String(index + 1),
      }));
    });
  };

  // Delete an output row
  const deleteOutputRow = (id: string) => {
    setOutputs((prev) => {
      const newOutputs = prev.filter((output) => output.id !== id);
      // Renumber the outputs
      return newOutputs.map((output, index) => ({
        ...output,
        number: String(index + 1),
      }));
    });
  };

  // Move input row function for drag-and-drop reordering
  const moveInputRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setInputs((prevInputs) => {
      const result = [...prevInputs];
      // Remove the dragged item
      const [removed] = result.splice(dragIndex, 1);
      // Insert it at the new position
      result.splice(hoverIndex, 0, removed);

      // Optional: Update row numbers if you want to maintain sequential numbering
      // return result.map((item, index) => ({
      //   ...item,
      //   number: String(index + 1),
      // }));

      return result;
    });
  }, []);

  // Move output row function for drag-and-drop reordering
  const moveOutputRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setOutputs((prevOutputs) => {
      const result = [...prevOutputs];
      // Remove the dragged item
      const [removed] = result.splice(dragIndex, 1);
      // Insert it at the new position
      result.splice(hoverIndex, 0, removed);

      // Optional: Update row numbers if you want to maintain sequential numbering
      // return result.map((item, index) => ({
      //   ...item,
      //   number: String(index + 1),
      // }));

      return result;
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          backgroundColor: "transparent",
          color: "white",
          padding: "20px",
          borderRadius: "0",
          boxShadow: "none",
        }}
      >
        <style>
          {`
            .input-output-table tr:hover .insert-row-button {
              opacity: 1;
            }
            
            .input-output-table tr .insert-row-button {
              opacity: 0;
            }
            
            .insert-row-button {
              position: absolute;
              bottom: -12px;
              left: 50%;
              transform: translateX(-50%);
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: linear-gradient(145deg, #0074e8, #0055cc);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 10;
              color: white;
              box-shadow: 
                0 2px 4px rgba(0,0,0,0.3),
                inset 0 1px 1px rgba(255,255,255,0.4),
                inset 0 -1px 1px rgba(0,0,0,0.3);
              transition: transform 0.1s, box-shadow 0.1s;
            }
            
            .insert-row-button svg {
              width: 12px;
              height: 12px;
              stroke: white;
              stroke-width: 3;
            }
            
            .insert-row-button:hover {
              transform: translateX(-50%) scale(1.05);
              box-shadow: 
                0 3px 6px rgba(0,0,0,0.4),
                inset 0 1px 1px rgba(255,255,255,0.4),
                inset 0 -1px 1px rgba(0,0,0,0.3);
            }
            
            .insert-row-button:active {
              transform: translateX(-50%) scale(0.98);
              background: linear-gradient(145deg, #0055cc, #0074e8);
              box-shadow: 
                0 1px 2px rgba(0,0,0,0.4),
                inset 0 1px 1px rgba(0,0,0,0.3);
            }
          `}
        </style>
        <h2 style={{ color: "white", marginBottom: "16px", fontWeight: 300 }}>
          Stage Input List
        </h2>
        <table
          className="input-output-table"
          style={{
            tableLayout: "fixed",
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <colgroup>
            <col style={{ width: "15%" }} /> {/* Input # */}
            <col style={{ width: "30%" }} /> {/* Channel Name */}
            <col style={{ width: "20%" }} /> {/* Mic/DI Type */}
            <col style={{ width: "20%" }} /> {/* Stand Type */}
            <col style={{ width: "15%" }} /> {/* Actions */}
          </colgroup>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Input #
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Channel Name
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Mic/DI Type
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Stand Type
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {inputs.map((input, index) => (
              <DraggableInputRow
                key={input.id}
                input={input}
                index={index}
                id={input.id}
                moveRow={moveInputRow}
                handleInputChange={handleInputChange}
                deleteInputRow={deleteInputRow}
                insertInputRow={insertInputRow}
              />
            ))}
          </tbody>
        </table>

        <button
          onClick={addInputRow}
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            padding: "8px 16px",
            borderRadius: "0",
            fontWeight: "normal",
            cursor: "pointer",
            marginBottom: "30px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Add Input
        </button>

        <h2 style={{ color: "white", marginBottom: "16px", fontWeight: 300 }}>
          Stage Output List
        </h2>
        <table
          className="input-output-table"
          style={{
            tableLayout: "fixed",
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <colgroup>
            <col style={{ width: "15%" }} /> {/* Output # */}
            <col style={{ width: "40%" }} /> {/* Channel Name */}
            <col style={{ width: "30%" }} /> {/* Monitor Type */}
            <col style={{ width: "15%" }} /> {/* Actions */}
          </colgroup>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Output #
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Channel Name
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Monitor Type
              </th>
              <th style={{ padding: "12px", color: "white", fontWeight: 400 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {outputs.map((output, index) => (
              <DraggableOutputRow
                key={output.id}
                output={output}
                index={index}
                id={output.id}
                moveRow={moveOutputRow}
                handleOutputChange={handleOutputChange}
                deleteOutputRow={deleteOutputRow}
                insertOutputRow={insertOutputRow}
              />
            ))}
          </tbody>
        </table>

        <button
          onClick={addOutputRow}
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            padding: "8px 16px",
            borderRadius: "0",
            fontWeight: "normal",
            cursor: "pointer",
            marginTop: "16px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Add Output
        </button>
      </div>
    </DndProvider>
  );
};

export default InputOutputTable;

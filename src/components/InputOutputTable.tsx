import React, { useState, useEffect, useCallback } from "react";
import { StageInputOutput, InputRow, OutputRow } from "../types/stage";
import { v4 as uuidv4 } from "uuid";

interface InputOutputTableProps {
  inputOutput: StageInputOutput | undefined;
  onChange: (inputOutput: StageInputOutput) => void;
}

// Predefined options for MIC/DI type dropdown
const micDiOptions = [
  "DI",
  "Stereo DI",
  "SM57",
  "SM58",
  "SM81",
  "Beta 52",
  "Beta 57",
  "Beta 58",
  "Beta 91",
  "Beta 98",
  "MD421",
  "MD441",
  "e609",
  "e906",
  "C414",
  "KM184",
  "U87",
  "AT4050",
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
    } else if (isInitialRender) {
      // Initialize with one empty row for each section only on initial render
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
  }, [inputOutput, isInitialRender]);

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

  return (
    <div
      style={{
        backgroundColor: "transparent",
        color: "white",
        padding: "20px",
        borderRadius: "0",
        boxShadow: "none",
      }}
    >
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
            <tr
              key={index}
              style={{
                backgroundColor: "transparent",
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              }}
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
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Delete row"
                >
                  🗑️
                </button>
              </td>
            </tr>
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
            <tr
              key={index}
              style={{
                backgroundColor: "transparent",
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              }}
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
                  value={output.channelType}
                  onChange={(value) => {
                    handleOutputChange(output.id, "channelType", value);
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
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Delete row"
                >
                  🗑️
                </button>
              </td>
            </tr>
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
  );
};

export default InputOutputTable;

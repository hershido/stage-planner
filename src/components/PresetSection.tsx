import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  StagePreset,
  getAvailablePresets,
  savePreset,
  deletePreset,
  updatePreset,
} from "../services/presetService";
import { StageItem, StageInputOutput, TechnicalInfo } from "../types/stage";

interface PresetSectionProps {
  onPresetSelect: (preset: StagePreset) => void;
  currentItems?: StageItem[];
  currentInputOutput?: StageInputOutput;
  currentTechnicalInfo?: TechnicalInfo;
}

const PresetSection: React.FC<PresetSectionProps> = ({
  onPresetSelect,
  currentItems,
  currentInputOutput,
  currentTechnicalInfo,
}) => {
  const { currentUser } = useAuth();
  const [presets, setPresets] = useState<StagePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // New preset form state
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("Band");
  const [isPublic, setIsPublic] = useState(true);

  // Edit preset state
  const [editingPreset, setEditingPreset] = useState<StagePreset | null>(null);

  // Reference to the category dropdown
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Load presets on component mount or when user changes
  useEffect(() => {
    const loadPresets = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = currentUser?.uid;
        const availablePresets = await getAvailablePresets(userId);
        setPresets(availablePresets);
      } catch (err) {
        console.error("Error loading presets:", err);
        setError("Failed to load presets");
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, [currentUser]);

  // Handle preset selection
  const handlePresetSelect = (preset: StagePreset) => {
    onPresetSelect(preset);
  };

  // Toggle the section expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle admin mode
  const toggleAdminMode = () => {
    if (!currentUser) {
      setError("You must be logged in to use admin features");
      return;
    }
    setIsAdminMode(!isAdminMode);
    setShowNewPresetForm(false);
  };

  // Show the new preset form
  const showAddPresetForm = () => {
    if (!currentUser) {
      setError("You must be logged in to create presets");
      return;
    }

    if (!currentItems || currentItems.length === 0) {
      setError("You must have items on the stage to create a preset");
      return;
    }

    setNewPresetName("");
    setNewPresetDescription("");
    setNewPresetCategory("Band");
    setIsPublic(true);
    setShowNewPresetForm(true);
  };

  // Handle preset creation
  const handleCreatePreset = async () => {
    if (!currentUser || !currentItems) {
      setError("Unable to create preset: missing user or stage items");
      return;
    }

    if (!newPresetName.trim()) {
      setError("Please enter a name for the preset");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await savePreset(
        newPresetName,
        newPresetDescription,
        newPresetCategory,
        currentItems,
        currentUser.uid,
        isPublic,
        currentInputOutput,
        currentTechnicalInfo
      );

      // Refresh presets
      const updatedPresets = await getAvailablePresets(currentUser.uid);
      setPresets(updatedPresets);

      // Hide form
      setShowNewPresetForm(false);
    } catch (err) {
      console.error("Error creating preset:", err);
      setError("Failed to create preset");
    } finally {
      setLoading(false);
    }
  };

  // Delete a preset
  const handleDeletePreset = async (presetId: string) => {
    if (!currentUser) {
      setError("You must be logged in to delete presets");
      return;
    }

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this preset?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deletePreset(presetId);

      // Refresh presets
      const updatedPresets = await getAvailablePresets(currentUser.uid);
      setPresets(updatedPresets);
    } catch (err) {
      console.error("Error deleting preset:", err);
      setError("Failed to delete preset");
    } finally {
      setLoading(false);
    }
  };

  // Start editing a preset
  const startEditPreset = (preset: StagePreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setNewPresetDescription(preset.description);
    setNewPresetCategory(preset.category);
    setIsPublic(preset.isPublic);
  };

  // Save preset edits
  const handleSavePresetEdits = async () => {
    if (!currentUser || !editingPreset) {
      setError("Unable to update preset");
      return;
    }

    if (!newPresetName.trim()) {
      setError("Please enter a name for the preset");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updatePreset(editingPreset.id, {
        name: newPresetName,
        description: newPresetDescription,
        category: newPresetCategory,
        isPublic,
      });

      // Refresh presets
      const updatedPresets = await getAvailablePresets(currentUser.uid);
      setPresets(updatedPresets);

      // Clear editing state
      setEditingPreset(null);
    } catch (err) {
      console.error("Error updating preset:", err);
      setError("Failed to update preset");
    } finally {
      setLoading(false);
    }
  };

  // Cancel preset editing or creation
  const handleCancelPresetForm = () => {
    setShowNewPresetForm(false);
    setEditingPreset(null);
    setError(null);
  };

  // Categories for presets
  const presetCategories = [
    "Band",
    "Orchestra",
    "DJ",
    "Conference",
    "Theater",
    "Classroom",
    "Other",
  ];

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, StagePreset[]>);

  return (
    <div className="sidebar-category">
      <div
        className="sidebar-category-header"
        onClick={toggleExpand}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 15px",
          backgroundColor: "#333333",
          borderBottom: "1px solid #444444",
          cursor: "pointer",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          Stage Presets
        </h3>
        <div style={{ display: "flex", alignItems: "center" }}>
          {currentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAdminMode();
              }}
              style={{
                background: isAdminMode ? "#6a3d3d" : "#2b5278",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                marginRight: "10px",
                fontSize: "12px",
                cursor: "pointer",
                color: "#ffffff",
              }}
            >
              {isAdminMode ? "Exit Admin" : "Admin"}
            </button>
          )}
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              color: "#ffffff",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div
          className="sidebar-category-content"
          style={{ padding: "15px", backgroundColor: "#323232" }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "#6a3d3d",
                color: "#ffffff",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              {error}
              <button
                onClick={() => setError(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  float: "right",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>
          )}

          {isAdminMode && (
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ fontSize: "14px", marginTop: 0, color: "#ffffff" }}>
                Admin Functions
              </h4>

              {!showNewPresetForm && !editingPreset && (
                <button
                  onClick={showAddPresetForm}
                  style={{
                    backgroundColor: "#2b784a",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    width: "100%",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  Create New Preset from Current Stage
                </button>
              )}

              {(showNewPresetForm || editingPreset) && (
                <div style={{ marginBottom: "15px" }}>
                  <h4
                    style={{
                      fontSize: "14px",
                      margin: "10px 0",
                      color: "#ffffff",
                    }}
                  >
                    {editingPreset ? "Edit Preset" : "Create New Preset"}
                  </h4>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="preset-name"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "12px",
                        color: "#eeeeee",
                      }}
                    >
                      Name:
                    </label>
                    <input
                      id="preset-name"
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #555555",
                        backgroundColor: "#444444",
                        color: "#ffffff",
                      }}
                      placeholder="Preset name"
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="preset-description"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "12px",
                        color: "#eeeeee",
                      }}
                    >
                      Description:
                    </label>
                    <textarea
                      id="preset-description"
                      value={newPresetDescription}
                      onChange={(e) => setNewPresetDescription(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #555555",
                        backgroundColor: "#444444",
                        color: "#ffffff",
                        minHeight: "60px",
                      }}
                      placeholder="Short description"
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      htmlFor="preset-category"
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "12px",
                        color: "#eeeeee",
                      }}
                    >
                      Category:
                    </label>
                    <input
                      id="preset-category"
                      ref={categoryInputRef}
                      list="preset-categories"
                      type="text"
                      value={newPresetCategory}
                      onChange={(e) => setNewPresetCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #555555",
                        backgroundColor: "#444444",
                        color: "#ffffff",
                      }}
                      placeholder="Category"
                    />
                    <datalist id="preset-categories">
                      {presetCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "12px",
                        cursor: "pointer",
                        color: "#eeeeee",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ marginRight: "5px" }}
                      />
                      Make this preset available to all users
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={
                        editingPreset
                          ? handleSavePresetEdits
                          : handleCreatePreset
                      }
                      disabled={loading}
                      style={{
                        backgroundColor: "#2b784a",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        flex: 1,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading
                        ? "Working..."
                        : editingPreset
                        ? "Save Changes"
                        : "Create Preset"}
                    </button>

                    <button
                      onClick={handleCancelPresetForm}
                      disabled={loading}
                      style={{
                        backgroundColor: "#555555",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        flex: 1,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && !showNewPresetForm && !editingPreset ? (
            <p style={{ textAlign: "center", color: "#cccccc" }}>
              Loading presets...
            </p>
          ) : presets.length === 0 ? (
            <p style={{ textAlign: "center", color: "#cccccc" }}>
              {isAdminMode
                ? "No presets found. Create your first preset!"
                : "No presets available yet."}
            </p>
          ) : (
            <div>
              {Object.entries(presetsByCategory).map(
                ([category, categoryPresets]) => (
                  <div key={category} style={{ marginBottom: "15px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        margin: "10px 0",
                        color: "#ffffff",
                        borderBottom: "1px solid #555555",
                        paddingBottom: "5px",
                      }}
                    >
                      {category}
                    </h4>

                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                    >
                      {categoryPresets.map((preset) => (
                        <div
                          key={preset.id}
                          style={{
                            width: "calc(50% - 5px)",
                            border: "1px solid #555555",
                            borderRadius: "4px",
                            padding: "10px",
                            backgroundColor: "#3a3a3a",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            position: "relative",
                          }}
                        >
                          <div
                            onClick={() => handlePresetSelect(preset)}
                            style={{ cursor: "pointer" }}
                          >
                            <h5
                              style={{
                                margin: "0 0 5px",
                                fontSize: "14px",
                                color: "#ffffff",
                              }}
                            >
                              {preset.name}
                            </h5>

                            {preset.description && (
                              <p
                                style={{
                                  margin: "0 0 10px",
                                  fontSize: "12px",
                                  color: "#cccccc",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {preset.description}
                              </p>
                            )}
                          </div>

                          {isAdminMode &&
                            preset.createdBy === currentUser?.uid && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginTop: "8px",
                                  borderTop: "1px solid #555555",
                                  paddingTop: "8px",
                                }}
                              >
                                <button
                                  onClick={() => startEditPreset(preset)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#4da6ff",
                                    padding: "0",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => handleDeletePreset(preset.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ff6b6b",
                                    padding: "0",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PresetSection;

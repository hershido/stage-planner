import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  saveConfiguration,
  getUserConfigurations,
  deleteConfiguration,
  SavedConfig,
} from "../services/configService";
import { StageItem, StageInputOutput, TechnicalInfo } from "../types/stage";

interface ConfigManagerProps {
  items: StageItem[];
  inputOutput?: StageInputOutput;
  technicalInfo?: TechnicalInfo;
  onLoad: (
    items: StageItem[],
    configName: string,
    configId?: string,
    inputOutput?: StageInputOutput,
    technicalInfo?: TechnicalInfo
  ) => void;
  currentConfigName: string | null;
  currentConfigId: string | null;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onSaveAs?: () => void;
}

// Note: currentConfigName is required by the interface but displayed directly in App component
const ConfigManager: React.FC<ConfigManagerProps> = ({
  items,
  inputOutput,
  technicalInfo,
  onLoad,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentConfigName,
  currentConfigId,
  hasUnsavedChanges,
  onSave,
  onSaveAs,
}) => {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configName, setConfigName] = useState("");
  const [userConfigs, setUserConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"save" | "load">("save");

  // Load user configurations when the modal opens
  useEffect(() => {
    const loadConfigurations = async () => {
      if (isModalOpen && currentUser) {
        try {
          setLoading(true);
          setError(null);
          const configs = await getUserConfigurations(currentUser.uid);
          setUserConfigs(configs);
        } catch (error) {
          console.error("Error loading configurations:", error);
          setError("Failed to load your saved configurations");
        } finally {
          setLoading(false);
        }
      }
    };

    loadConfigurations();
  }, [isModalOpen, currentUser]);

  const openSaveModal = () => {
    setMode("save");
    setConfigName("");
    setIsModalOpen(true);
  };

  const openLoadModal = () => {
    setMode("load");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleSaveConfig = async () => {
    if (!currentUser) return;

    if (!configName.trim()) {
      setError("Please enter a name for your configuration");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (items.length === 0) {
        setError(
          "Cannot save an empty configuration. Add some items to the stage first."
        );
        return;
      }

      // Check if Firestore is working
      try {
        console.log("Current user ID:", currentUser.uid);
        console.log("Configuration name:", configName);
        console.log("Items count:", items.length);

        const newConfigId = await saveConfiguration(
          currentUser.uid,
          configName,
          items,
          inputOutput,
          technicalInfo
        );
        setConfigName("");
        closeModal();

        // Update current configuration to the one we just saved
        if (newConfigId) {
          onLoad(items, configName, newConfigId, inputOutput, technicalInfo);
        }

        // Add success message
        alert("Configuration saved successfully!");
      } catch (e) {
        console.error("Detailed save error:", e);

        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        setError(
          `Save failed: ${errorMessage}. Check browser console for details.`
        );

        // Check Firestore security rules
        console.warn(
          "If this keeps happening, check your Firestore security rules. They should allow writes from authenticated users."
        );
      }
    } catch (error) {
      console.error("Error in save handler:", error);
      setError(
        "Failed to save configuration. Try again or check browser console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConfig = (config: SavedConfig) => {
    try {
      if (!config.items || !Array.isArray(config.items)) {
        console.error("Invalid configuration items:", config.items);
        setError("Invalid configuration data");
        return;
      }

      console.log("Loading configuration:", config);
      onLoad(
        config.items,
        config.name,
        config.id,
        config.inputOutput,
        config.technicalInfo
      );
      closeModal();
    } catch (error) {
      console.error("Error loading configuration:", error);
      setError("Failed to load configuration");
    }
  };

  const handleDeleteConfig = async (
    configId: string | undefined,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the load function

    if (!configId) {
      console.error("Missing configuration ID");
      setError("Cannot delete: Missing configuration ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this configuration?")) {
      try {
        setLoading(true);
        setError(null);
        await deleteConfiguration(configId);
        setUserConfigs(userConfigs.filter((config) => config.id !== configId));
      } catch (error) {
        console.error("Error deleting configuration:", error);
        setError("Failed to delete configuration");
      } finally {
        setLoading(false);
      }
    }
  };

  // Buttons to open the modal
  const renderButtons = () => (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {/* Save button - enabled only when we have unsaved changes and a current config ID */}
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges || !currentConfigId}
        className={`header-button ${
          !hasUnsavedChanges || !currentConfigId ? "disabled" : ""
        }`}
        title={
          !currentConfigId
            ? "No configuration loaded to save"
            : !hasUnsavedChanges
            ? "No changes to save"
            : "Save changes to current configuration"
        }
      >
        <span style={{ fontFamily: "sans-serif" }}>&#128190;</span>
      </button>

      {/* Save As button - always enabled */}
      <button
        onClick={() => {
          if (onSaveAs) onSaveAs();
          openSaveModal();
        }}
        className="header-button"
        title="Save as a new configuration"
      >
        <span style={{ fontFamily: "sans-serif" }}>&#128190;+</span>
      </button>

      {/* Load button */}
      <button
        onClick={openLoadModal}
        className="header-button"
        title="Load configuration"
      >
        <span style={{ fontFamily: "sans-serif" }}>&#128194;</span>
      </button>
    </div>
  );

  // Modal content
  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            width: "400px",
            maxWidth: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              {mode === "save" ? "Save Configuration" : "Load Configuration"}
            </h2>
            <button
              onClick={closeModal}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#ffebee",
                color: "#c62828",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              {error}
            </div>
          )}

          {mode === "save" ? (
            <>
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor="configName"
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Configuration Name:
                </label>
                <input
                  id="configName"
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  placeholder="Enter a name for this configuration"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  width: "100%",
                }}
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "10px" }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                  Your Saved Configurations
                </h3>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    Loading...
                  </div>
                ) : userConfigs.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                    }}
                  >
                    You don't have any saved configurations yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {userConfigs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => handleLoadConfig(config)}
                        style={{
                          padding: "10px",
                          backgroundColor: "#e9f0f7",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid #cce0f5",
                          marginBottom: "4px",
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#d4e6f7";
                          e.currentTarget.style.boxShadow =
                            "0 2px 4px rgba(0,0,0,0.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#e9f0f7";
                          e.currentTarget.style.boxShadow =
                            "0 1px 2px rgba(0,0,0,0.05)";
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#333",
                              fontSize: "15px",
                            }}
                          >
                            {config.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#444" }}>
                            {config.createdAt.toDate().toLocaleString()}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#444",
                              fontWeight: "500",
                            }}
                          >
                            {config.items.length} items
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConfig(config.id, e)}
                          style={{
                            background: "#ffeeee",
                            color: "#d63031",
                            border: "1px solid #ffcccc",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          title="Delete configuration"
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#ffd8d8";
                            e.currentTarget.style.color = "#c0392b";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#ffeeee";
                            e.currentTarget.style.color = "#d63031";
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={closeModal}
                style={{
                  marginTop: "15px",
                  padding: "10px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "15px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                  e.currentTarget.style.color = "#000";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                  e.currentTarget.style.color = "#333";
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  return (
    <>
      {renderButtons()}
      {renderModal()}
    </>
  );
};

export default ConfigManager;

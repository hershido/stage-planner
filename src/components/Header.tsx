import React, { useState, useEffect } from "react";
import ConfigManager from "./ConfigManager";
import { StageItem, StageInputOutput, TechnicalInfo } from "../types/stage";
import newProjectIcon from "../assets/icons/newProjectIcon.svg";
import undoIcon from "../assets/icons/undoIcon.svg";
import redoIcon from "../assets/icons/redoIcon.svg";
import exprortToPdfIcon from "../assets/icons/exprortToPdf.svg";
import sidePanelIcon from "../assets/icons/sidePanelIcon.svg";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface HeaderProps {
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
  onNewConfig: () => void;
  handleExportPDF: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  currentHistoryIndex: number;
  historyLength: number;
  onTitleChange?: (newTitle: string) => void;
  children?: React.ReactNode;
  saveStatus?: SaveStatus;
  saveError?: string | null;
  toggleSidePanel?: () => void;
  isSidePanelOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  items,
  inputOutput,
  technicalInfo,
  onLoad,
  currentConfigName,
  currentConfigId,
  hasUnsavedChanges,
  onSave,
  onSaveAs,
  onNewConfig,
  handleExportPDF,
  handleUndo,
  handleRedo,
  currentHistoryIndex,
  historyLength,
  onTitleChange,
  children,
  saveStatus = "idle",
  saveError = null,
  toggleSidePanel,
  isSidePanelOpen,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(currentConfigName || "");
  const [isHovering, setIsHovering] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setTitleText(currentConfigName || "");
  }, [currentConfigName]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleText(e.target.value);
  };

  const handleTitleSubmit = () => {
    if (onTitleChange && titleText.trim()) {
      onTitleChange(titleText.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setTitleText(currentConfigName || ""); // Reset to original
      setIsEditingTitle(false);
    }
  };

  // Status indicator styles
  const getStatusStyles = () => {
    switch (saveStatus) {
      case "saving":
        return {
          color: "rgba(0, 116, 232, 0.7)",
          display: "flex",
          alignItems: "center",
        };
      case "saved":
        return {
          color: "rgba(76, 175, 80, 0.7)",
          display: "flex",
          alignItems: "center",
        };
      case "error":
        return { color: "#f44336", display: "flex", alignItems: "center" };
      default:
        return hasUnsavedChanges
          ? {
              color: "rgba(255, 152, 0, 0.7)",
              display: "flex",
              alignItems: "center",
            }
          : { display: "none" };
    }
  };

  return (
    <div className="app-header">
      {/* Current configuration name display */}
      <div
        className="config-title"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {currentConfigName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
            }}
          >
            {isEditingTitle ? (
              <input
                type="text"
                value={titleText}
                onChange={handleTitleChange}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  background: "transparent",
                  border: "1px solid #0074e8",
                  borderRadius: "4px",
                  padding: "0 10px",
                  color: "inherit",
                  width: "100%",
                  minWidth: "200px",
                }}
              />
            ) : (
              <>
                <h1
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 400,
                    letterSpacing: "0.5px",
                  }}
                >
                  {currentConfigName}
                </h1>
                {(isHovering || isEditingTitle) && onTitleChange && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "5px",
                    }}
                    title="Edit title"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Status indicator */}
        <div style={getStatusStyles()} className="save-status-indicator">
          {saveStatus === "saving" && (
            <>
              <div className="status-bullet saving">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <span>Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <div className="status-bullet saved">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17L4 12" />
                </svg>
              </div>
              <span>Changes saved</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <div className="status-bullet">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span>{saveError || "Error saving"}</span>
            </>
          )}
          {saveStatus === "idle" && hasUnsavedChanges && (
            <>
              <div className="status-bullet unsaved">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="6" />
                </svg>
              </div>
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="control-buttons">
        {/* New Configuration Button */}
        <button
          onClick={onNewConfig}
          className="header-button"
          title="New stage plan"
        >
          <img
            src={newProjectIcon}
            alt="New"
            width="20"
            height="20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* ConfigManager (includes Load button) */}
        <ConfigManager
          items={items}
          inputOutput={inputOutput}
          technicalInfo={technicalInfo}
          onLoad={onLoad}
          currentConfigName={currentConfigName || "Untitled"}
          currentConfigId={currentConfigId}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={onSave}
          onSaveAs={onSaveAs}
          saveStatus={saveStatus}
        />

        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={currentHistoryIndex <= 0}
          className={`header-button ${
            currentHistoryIndex <= 0 ? "disabled" : ""
          }`}
          title="Undo"
        >
          <img
            src={undoIcon}
            alt="Undo"
            width="20"
            height="20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* Redo button */}
        <button
          onClick={handleRedo}
          disabled={currentHistoryIndex >= historyLength - 1}
          className={`header-button ${
            currentHistoryIndex >= historyLength - 1 ? "disabled" : ""
          }`}
          title="Redo"
        >
          <img
            src={redoIcon}
            alt="Redo"
            width="20"
            height="20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* Side Panel toggle button */}
        <button
          onClick={toggleSidePanel}
          className={`header-button ${isSidePanelOpen ? "active" : ""}`}
          title="Open side panel with Input/Output and Technical Info"
        >
          <img
            src={sidePanelIcon}
            alt="Side Panel"
            width="20"
            height="20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* Export PDF button */}
        <button
          onClick={handleExportPDF}
          className="header-button pdf-button"
          title="Export to PDF"
        >
          <img
            src={exprortToPdfIcon}
            alt="Export to PDF"
            width="20"
            height="20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>
      </div>

      {/* User Menu */}
      <div className="user-menu-container">{children}</div>
    </div>
  );
};

export default Header;

import React, { ReactNode, useState, useEffect } from "react";
import ConfigManager from "./ConfigManager";
import { StageItem, StageInputOutput, TechnicalInfo } from "../types/stage";
import pdfDownloadIcon from "../assets/icons/pdfDownload.svg";

interface HeaderProps {
  items: StageItem[];
  inputOutput?: StageInputOutput;
  technicalInfo?: TechnicalInfo;
  onLoad: (
    importedItems: StageItem[],
    configName: string,
    configId?: string,
    importedInputOutput?: StageInputOutput,
    importedTechnicalInfo?: TechnicalInfo
  ) => void;
  currentConfigName: string | null;
  currentConfigId: string | null;
  hasUnsavedChanges: boolean;
  onSave: () => Promise<void>;
  onSaveAs: () => void;
  onNewConfig: () => void;
  handleExportPDF: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  currentHistoryIndex: number;
  historyLength: number;
  openTechnicalInfo: () => void;
  onTitleChange?: (newTitle: string) => void;
  children?: ReactNode;
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
  openTechnicalInfo,
  onTitleChange,
  children,
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
                <h1>
                  {hasUnsavedChanges
                    ? `${currentConfigName} *`
                    : currentConfigName}
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
      </div>

      {/* Control buttons */}
      <div className="control-buttons">
        {/* New Configuration Button */}
        <button
          onClick={onNewConfig}
          title="New Configuration"
          className="header-button"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Document base */}
            <path
              d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
              fill="white"
            />
            {/* Folded corner */}
            <path
              d="M14 2L20 8H15C14.4477 8 14 7.55228 14 7V2Z"
              fill="#BDE0FF"
            />
            {/* Text lines */}
            <path
              d="M7.5 11.5H16.5"
              stroke="#0074e8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M7.5 14.5H16.5"
              stroke="#0074e8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M7.5 17.5H16.5"
              stroke="#0074e8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Plus sign - moved to top right corner */}
            <circle cx="17" cy="7" r="4" fill="#0074e8" />
            <path
              d="M17 5V9M15 7H19"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* ConfigManager (includes Load button) */}
        <ConfigManager
          items={items}
          inputOutput={inputOutput}
          technicalInfo={technicalInfo}
          onLoad={onLoad}
          currentConfigName={currentConfigName}
          currentConfigId={currentConfigId}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={onSave}
          onSaveAs={onSaveAs}
        />

        {/* PDF Export Button */}
        <button
          onClick={handleExportPDF}
          title="Export to PDF"
          className="header-button pdf-button"
        >
          <img
            src={pdfDownloadIcon}
            alt="PDF"
            style={{ width: "38px", height: "38px" }}
          />
        </button>

        {/* Tech Rider Button */}
        <button
          onClick={openTechnicalInfo}
          title="Technical Info"
          className="header-button info-button"
        >
          Tech Rider
        </button>

        {/* Undo/Redo buttons */}
        <button
          onClick={handleUndo}
          disabled={currentHistoryIndex <= 0}
          title="Undo (Cmd+Z / Ctrl+Z)"
          className={`header-button ${
            currentHistoryIndex <= 0 ? "disabled" : ""
          }`}
        >
          <span style={{ fontFamily: "sans-serif" }}>&#8617;</span>
        </button>
        <button
          onClick={handleRedo}
          disabled={currentHistoryIndex >= historyLength - 1}
          title="Redo (Cmd+Shift+Z / Ctrl+Shift+Z)"
          className={`header-button ${
            currentHistoryIndex >= historyLength - 1 ? "disabled" : ""
          }`}
        >
          <span style={{ fontFamily: "sans-serif" }}>&#8618;</span>
        </button>
      </div>

      {/* User Menu */}
      <div className="user-menu-container">{children}</div>
    </div>
  );
};

export default Header;

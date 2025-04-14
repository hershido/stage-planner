import React, { ReactNode } from "react";
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
  children,
}) => {
  return (
    <div className="app-header">
      {/* Current configuration name display */}
      <div className="config-title">
        {currentConfigName && (
          <h1>
            {hasUnsavedChanges ? `${currentConfigName} *` : currentConfigName}
          </h1>
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

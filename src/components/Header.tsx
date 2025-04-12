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
        <button
          onClick={openTechnicalInfo}
          title="Technical Info"
          className="header-button info-button"
        >
          Tech Rider
        </button>
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

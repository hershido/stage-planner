import React, { useState, useEffect } from "react";
import { StageInputOutput, TechnicalInfo } from "../types/stage";
import InputOutputTable from "./InputOutputTable";
import TechnicalInfoForm from "./TechnicalInfoForm";
import sidePanelIcon from "../assets/icons/sidePanelIcon.svg";

interface SidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  inputOutput: StageInputOutput;
  onInputOutputChange: (newInputOutput: StageInputOutput) => void;
  technicalInfo: TechnicalInfo;
  onTechnicalInfoChange: (newTechnicalInfo: TechnicalInfo) => void;
  initialTab?: "inputOutput" | "technical";
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onToggle,
  inputOutput,
  onInputOutputChange,
  technicalInfo,
  onTechnicalInfoChange,
  initialTab = "inputOutput",
}) => {
  const [activeTab, setActiveTab] = useState<"inputOutput" | "technical">(
    initialTab
  );

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className={`side-panel ${isOpen ? "open" : "closed"}`}>
      {/* Panel handle as part of the panel */}
      <div className="panel-tab" onClick={onToggle}>
        <img
          src={sidePanelIcon}
          alt="Toggle Panel"
          width="20"
          height="20"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* Panel Content */}
      <div
        className="panel-content"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Tabs */}
        <div className="panel-tabs">
          <div
            className={`tab ${activeTab === "inputOutput" ? "active" : ""}`}
            onClick={() => setActiveTab("inputOutput")}
          >
            Input / Output
          </div>
          <div
            className={`tab ${activeTab === "technical" ? "active" : ""}`}
            onClick={() => setActiveTab("technical")}
          >
            Technical Info
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "inputOutput" && (
            <div className="input-output-tab">
              <InputOutputTable
                inputOutput={inputOutput}
                onChange={onInputOutputChange}
              />
            </div>
          )}

          {activeTab === "technical" && (
            <div className="technical-tab" style={{ height: "100%" }}>
              <TechnicalInfoForm
                isOpen={true}
                onClose={() => {}} // Not used in this context
                technicalInfo={technicalInfo}
                onSave={onTechnicalInfoChange}
                isEmbedded={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;

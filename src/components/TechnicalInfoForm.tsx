import React, { useState, useEffect } from "react";
import { TechnicalInfo, Person } from "../types/stage";
import { v4 as uuidv4 } from "uuid";

// Expanded list of predefined options for mixing desk dropdown
const MIXING_DESK_OPTIONS = [
  // Digital Consoles - High End
  "Digico Quantum Series 338",
  "Digico Quantum Series 225",
  "Digico SD Series 10",
  "Digico SD Series 12",
  "Digico SD Series 9",
  "Digico SD Series 8",
  "Digico SD Series 7",
  "Digico SD Series 5",
  "Avid S6L-32D",
  "Avid S6L-24D",
  "Avid S6L-16C",
  "Avid VENUE | S6L",
  "Avid Profile",
  "Avid VENUE",
  "SSL Live L500",
  "SSL Live L550",
  "SSL Live L350",
  "Midas Pro Series XL",
  "Midas Pro Series X",
  "Midas Pro6",
  "Midas Pro2",
  "Allen & Heath dLive S7000",
  "Allen & Heath dLive S5000",
  "Allen & Heath dLive S3000",
  "Allen & Heath iLive T112",

  // Digital Consoles - Mid Range
  "Yamaha RIVAGE PM10",
  "Yamaha RIVAGE PM7",
  "Yamaha CL5",
  "Yamaha CL3",
  "Yamaha CL1",
  "Yamaha QL5",
  "Yamaha QL1",
  "Yamaha M7CL",
  "Yamaha LS9",
  "Soundcraft Vi7000",
  "Soundcraft Vi6000",
  "Soundcraft Vi3000",
  "Soundcraft Vi1000",
  "Soundcraft Si Series",

  // Digital Consoles - Budget/Smaller Venues
  "Behringer X32",
  "Behringer X32 Compact",
  "Behringer X32 Producer",
  "Behringer X32 Rack",
  "Behringer Wing",
  "Allen & Heath SQ-5",
  "Allen & Heath SQ-6",
  "Allen & Heath SQ-7",
  "Allen & Heath Avantis",
  "Midas M32",
  "PreSonus StudioLive Series III",
  "QSC TouchMix Series",

  // Analog Consoles
  "Midas Heritage 3000",
  "Midas XL4",
  "Midas XL3",
  "Midas XL2",
  "Midas Venice",
  "Soundcraft MH Series",
  "Soundcraft GB Series",
  "Allen & Heath GL Series",
  "Yamaha PM Series (Analog)",
  "Mackie 8-Bus Series",
  "SSL 4000 Series",
  "API Legacy",
  "Neve VR Series",
];

interface TechnicalInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  technicalInfo?: TechnicalInfo;
  onSave: (technicalInfo: TechnicalInfo) => void;
  isEmbedded?: boolean;
}

const TechnicalInfoForm: React.FC<TechnicalInfoFormProps> = ({
  isOpen,
  onClose,
  technicalInfo,
  onSave,
  isEmbedded = false,
}) => {
  const [projectTitle, setProjectTitle] = useState("");
  const [personnel, setPersonnel] = useState<Person[]>([]);
  const [generalInfo, setGeneralInfo] = useState("");
  const [houseSystem, setHouseSystem] = useState("");
  const [mixingDesk, setMixingDesk] = useState<string[]>([]);
  const [customMixingDesk, setCustomMixingDesk] = useState("");
  const [monitoring, setMonitoring] = useState("");
  const [backline, setBackline] = useState("");
  const [soundCheck, setSoundCheck] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // For personnel form
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personEmail, setPersonEmail] = useState("");

  // Initialize form with existing data if available
  useEffect(() => {
    if (technicalInfo) {
      setProjectTitle(technicalInfo.projectTitle || "");
      setPersonnel(technicalInfo.personnel || []);
      setGeneralInfo(technicalInfo.generalInfo || "");
      setHouseSystem(technicalInfo.houseSystem || "");

      // Handle backward compatibility with string or string[]
      if (Array.isArray(technicalInfo.mixingDesk)) {
        setMixingDesk(technicalInfo.mixingDesk || []);
      } else if (technicalInfo.mixingDesk) {
        // Convert single string to array with one element
        setMixingDesk([technicalInfo.mixingDesk]);
      } else {
        setMixingDesk([]);
      }

      setMonitoring(technicalInfo.monitoring || "");
      setBackline(technicalInfo.backline || "");
      setSoundCheck(technicalInfo.soundCheck || "");
    } else {
      // Set default values for a new form
      setProjectTitle("");
      setPersonnel([]);
      setGeneralInfo("");
      setHouseSystem("");
      setMixingDesk([]);
      setCustomMixingDesk("");
      setMonitoring("");
      setBackline("");
      setSoundCheck("");
    }
  }, [technicalInfo, isOpen]);

  // Function to update the parent component with current data
  const updateTechnicalInfo = () => {
    // Build the final mixingDesk value, which includes both selected options and custom input
    const finalMixingDesks = customMixingDesk.trim()
      ? [...mixingDesk, customMixingDesk]
      : [...mixingDesk];

    // Only save if the data has actually changed
    if (
      !technicalInfo ||
      projectTitle !== technicalInfo.projectTitle ||
      generalInfo !== technicalInfo.generalInfo ||
      houseSystem !== technicalInfo.houseSystem ||
      // For array, check if lengths differ or content differs
      !Array.isArray(technicalInfo.mixingDesk) ||
      finalMixingDesks.length !== technicalInfo.mixingDesk.length ||
      finalMixingDesks.some(
        (desk) => !technicalInfo.mixingDesk.includes(desk)
      ) ||
      monitoring !== technicalInfo.monitoring ||
      backline !== technicalInfo.backline ||
      soundCheck !== technicalInfo.soundCheck ||
      // For personnel, check if the array has changed in length or content
      personnel.length !== technicalInfo.personnel?.length ||
      JSON.stringify(personnel) !== JSON.stringify(technicalInfo.personnel)
    ) {
      const newTechnicalInfo: TechnicalInfo = {
        projectTitle,
        personnel,
        generalInfo,
        houseSystem,
        mixingDesk: finalMixingDesks,
        monitoring,
        backline,
        soundCheck,
      };

      onSave(newTechnicalInfo);
    }
  };

  // Handle mixing desk checkbox changes
  const handleMixingDeskChange = (desk: string) => {
    if (mixingDesk.includes(desk)) {
      // Remove the desk if already selected
      setMixingDesk(mixingDesk.filter((d) => d !== desk));
    } else {
      // Add the desk if not already selected
      setMixingDesk([...mixingDesk, desk]);
    }
  };

  // Update data when any field changes - using a timeout to avoid too frequent updates
  useEffect(() => {
    if (isOpen) {
      // Use a small delay to avoid triggering on initial form load
      const timeoutId = setTimeout(() => {
        updateTechnicalInfo();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [
    projectTitle,
    personnel,
    generalInfo,
    houseSystem,
    mixingDesk,
    customMixingDesk,
    monitoring,
    backline,
    soundCheck,
    isOpen,
  ]);

  const addPerson = () => {
    if (personName && personRole) {
      const newPerson: Person = {
        id: uuidv4(),
        name: personName,
        role: personRole,
        phone: personPhone || undefined,
        email: personEmail || undefined,
      };
      setPersonnel([...personnel, newPerson]);
      // Reset form fields
      setPersonName("");
      setPersonRole("");
      setPersonPhone("");
      setPersonEmail("");
    }
  };

  const removePerson = (id: string) => {
    setPersonnel(personnel.filter((person) => person.id !== id));
  };

  // Filter mixing desks based on search query
  const filteredMixingDesks = MIXING_DESK_OPTIONS.filter((desk) =>
    desk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  // Different styles for modal vs embedded mode
  const containerStyle = isEmbedded
    ? {
        height: "100%",
        backgroundColor: "transparent",
        overflowY: "auto" as const,
        color: "white",
      }
    : {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      };

  const formContainerStyle = isEmbedded
    ? {
        backgroundColor: "transparent",
        padding: "0",
        height: "100%",
        overflow: "auto" as const,
      }
    : {
        backgroundColor: "#222",
        padding: "20px",
        borderRadius: "8px",
        width: "800px",
        maxWidth: "90%",
        maxHeight: "90vh",
        overflowY: "auto" as const,
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        {!isEmbedded && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              paddingBottom: "10px",
            }}
          >
            <h2 style={{ margin: 0, fontWeight: 300 }}>
              Technical Information
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "white",
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="projectTitle"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Project Title:
          </label>
          <input
            id="projectTitle"
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
            }}
            placeholder="Enter project title"
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", fontWeight: 300 }}>Personnel</h3>

          {/* Personnel table */}
          {personnel.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "15px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Role</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {personnel.map((person) => (
                  <tr
                    key={person.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <td style={{ padding: "8px" }}>{person.name}</td>
                    <td style={{ padding: "8px" }}>{person.role}</td>
                    <td style={{ padding: "8px" }}>{person.phone || "-"}</td>
                    <td style={{ padding: "8px" }}>{person.email || "-"}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <button
                        onClick={() => removePerson(person.id)}
                        style={{
                          backgroundColor: "transparent",
                          color: "white",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          padding: "5px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "30px",
                          height: "30px",
                          margin: "0 auto",
                        }}
                        title="Remove person"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add person form */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Name"
              style={{
                flex: "1",
                minWidth: "150px",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
            />
            <input
              type="text"
              value={personRole}
              onChange={(e) => setPersonRole(e.target.value)}
              placeholder="Role"
              style={{
                flex: "1",
                minWidth: "150px",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
            />
            <input
              type="text"
              value={personPhone}
              onChange={(e) => setPersonPhone(e.target.value)}
              placeholder="Phone (optional)"
              style={{
                flex: "1",
                minWidth: "150px",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
            />
            <input
              type="text"
              value={personEmail}
              onChange={(e) => setPersonEmail(e.target.value)}
              placeholder="Email (optional)"
              style={{
                flex: "1",
                minWidth: "150px",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={addPerson}
              disabled={!personName || !personRole}
              style={{
                padding: "8px 15px",
                backgroundColor:
                  !personName || !personRole
                    ? "rgba(52, 152, 219, 0.3)"
                    : "rgba(52, 152, 219, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !personName || !personRole ? "not-allowed" : "pointer",
              }}
            >
              Add Person
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="generalInfo"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            General Info:
          </label>
          <textarea
            id="generalInfo"
            value={generalInfo}
            onChange={(e) => setGeneralInfo(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              resize: "vertical",
            }}
            placeholder="Enter general information"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="houseSystem"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            House System:
          </label>
          <textarea
            id="houseSystem"
            value={houseSystem}
            onChange={(e) => setHouseSystem(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              resize: "vertical",
            }}
            placeholder="Enter house system details"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="mixingDesk"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Supported Mixing Desks: (Select multiple)
          </label>

          {/* Search input for mixing desks */}
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mixing desks..."
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              padding: "10px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {filteredMixingDesks.length > 0 ? (
              filteredMixingDesks.map((desk) => (
                <div
                  key={desk}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    id={`desk-${desk}`}
                    checked={mixingDesk.includes(desk)}
                    onChange={() => handleMixingDeskChange(desk)}
                    style={{
                      marginRight: "8px",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    htmlFor={`desk-${desk}`}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {desk}
                  </label>
                </div>
              ))
            ) : (
              <div
                style={{ padding: "8px", color: "rgba(255, 255, 255, 0.6)" }}
              >
                No mixing desks match your search. Add a custom mixer below.
              </div>
            )}
          </div>

          <div style={{ marginTop: "10px" }}>
            <label
              htmlFor="customMixingDesk"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
              }}
            >
              Other Mixing Desks:
            </label>
            <input
              id="customMixingDesk"
              type="text"
              value={customMixingDesk}
              onChange={(e) => setCustomMixingDesk(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
              placeholder="Enter additional mixing desks not in the list above"
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="monitoring"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Monitoring:
          </label>
          <textarea
            id="monitoring"
            value={monitoring}
            onChange={(e) => setMonitoring(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              resize: "vertical",
            }}
            placeholder="Enter monitoring details"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="backline"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Backline:
          </label>
          <textarea
            id="backline"
            value={backline}
            onChange={(e) => setBackline(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              resize: "vertical",
            }}
            placeholder="Enter backline details"
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label
            htmlFor="soundCheck"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Sound Check:
          </label>
          <textarea
            id="soundCheck"
            value={soundCheck}
            onChange={(e) => setSoundCheck(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              resize: "vertical",
            }}
            placeholder="Enter sound check schedule"
          />
        </div>

        {!isEmbedded && (
          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginRight: "10px",
                padding: "8px 16px",
                backgroundColor: "#f5f5f5",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalInfoForm;

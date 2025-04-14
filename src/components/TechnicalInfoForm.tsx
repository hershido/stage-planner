import React, { useState, useEffect } from "react";
import { TechnicalInfo, Person } from "../types/stage";
import { v4 as uuidv4 } from "uuid";

// Predefined options for mixing desk dropdown
const MIXING_DESK_OPTIONS = [
  "Digico Quantum Series 338",
  "Digico SD Series 10",
  "Digico SD Series 12",
  "Digico SD Series 9",
  "Midas Pro Series",
  "Avid S6L",
  "Allen & Heath dLive",
  "Yamaha CL5",
  "Yamaha QL5",
  "Soundcraft Vi7000",
  "Soundcraft Vi6000",
  "Behringer X32",
];

interface TechnicalInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  technicalInfo?: TechnicalInfo;
  onSave: (technicalInfo: TechnicalInfo) => void;
}

const TechnicalInfoForm: React.FC<TechnicalInfoFormProps> = ({
  isOpen,
  onClose,
  technicalInfo,
  onSave,
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

  if (!isOpen) return null;

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
          backgroundColor: "#222",
          padding: "20px",
          borderRadius: "8px",
          width: "800px",
          maxWidth: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
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
          <h2 style={{ margin: 0, fontWeight: 300 }}>Technical Information</h2>
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
            {MIXING_DESK_OPTIONS.map((desk) => (
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
            ))}
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
      </div>
    </div>
  );
};

export default TechnicalInfoForm;

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
  const [mixingDesk, setMixingDesk] = useState("");
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
      setMixingDesk(technicalInfo.mixingDesk || "");
      setMonitoring(technicalInfo.monitoring || "");
      setBackline(technicalInfo.backline || "");
      setSoundCheck(technicalInfo.soundCheck || "");
    } else {
      // Set default values for a new form
      setProjectTitle("");
      setPersonnel([]);
      setGeneralInfo("");
      setHouseSystem("");
      setMixingDesk("");
      setMonitoring("");
      setBackline("");
      setSoundCheck("");
    }
  }, [technicalInfo, isOpen]);

  const handleSave = () => {
    const newTechnicalInfo: TechnicalInfo = {
      projectTitle,
      personnel,
      generalInfo,
      houseSystem,
      mixingDesk,
      monitoring,
      backline,
      soundCheck,
    };
    onSave(newTechnicalInfo);
    onClose();
  };

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
            Mixing Desk:
          </label>
          <select
            id="mixingDesk"
            value={mixingDesk}
            onChange={(e) => setMixingDesk(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
            }}
          >
            <option value="">-- Select a Mixing Desk --</option>
            {MIXING_DESK_OPTIONS.map((desk) => (
              <option key={desk} value={desk}>
                {desk}
              </option>
            ))}
            <option value="custom">Custom / Other</option>
          </select>
          {mixingDesk === "custom" && (
            <input
              type="text"
              value={mixingDesk === "custom" ? "" : mixingDesk}
              onChange={(e) => setMixingDesk(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
              }}
              placeholder="Enter custom mixing desk"
            />
          )}
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

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 15px",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 15px",
              backgroundColor: "rgba(52, 152, 219, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInfoForm;

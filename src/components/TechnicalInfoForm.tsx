import React, { useState, useEffect } from "react";
import { TechnicalInfo, Person, MonitorItem } from "../types/stage";
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

// Predefined monitor types and models
const MONITOR_TYPES = [
  "Wedge",
  "Sidefill",
  "Drumfill",
  "In-Ear Monitor",
  "Floor Monitor",
  "Personal Monitor",
  "Headphones",
];

// Brands and their models
const MONITOR_BRANDS: Record<string, string[]> = {
  "d&b audiotechnik": ["M4", "M2", "MAX2", "Q7", "Q10", "B2", "B4"],
  "Meyer Sound": ["MJF-210", "MJF-212A", "CQ-1", "UPA-1P", "700-HP", "USW-1P"],
  "L-Acoustics": [
    "X12",
    "X15 HiQ",
    "115XT HiQ",
    "ARCS II",
    "ARCS Focus",
    "Kara",
    "SB15P",
    "SB18",
  ],
  Adamson: ["M15", "Point 12"],
  EAW: ["Microwedge", "SB850"],
  Nexo: ["PS15"],
  Clair: ["12AM"],
  JBL: ["SRX712M", "SRX828SP"],
  QSC: ["K12.2"],
  Yamaha: ["SM15V"],
  Shure: ["PSM 1000", "PSM 900", "PSM 300"],
  Sennheiser: ["EW IEM G4", "2000 IEM", "HD-25", "HD-280 Pro"],
  "Audio-Technica": ["M3", "ATH-M50x"],
  Lectrosonics: ["R400A"],
  "Axient Digital": ["ADX5D"],
  Behringer: ["Powerplay P1", "Powerplay P2"],
  "Allen & Heath": ["ME-1", "ME-500"],
  Roland: ["M-48"],
  Aviom: ["A360"],
  Sony: ["MDR-7506"],
  Beyerdynamic: ["DT 770 Pro"],
  AKG: ["K240 Studio"],
};

// Get all available monitor brands
const MONITOR_BRAND_NAMES = Object.keys(MONITOR_BRANDS);

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
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [monitoring, setMonitoring] = useState("");
  const [backline, setBackline] = useState("");
  const [soundCheck, setSoundCheck] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // For monitor form
  const [monitorType, setMonitorType] = useState("");
  const [monitorBrand, setMonitorBrand] = useState("");
  const [monitorModel, setMonitorModel] = useState("");
  const [monitorQuantity, setMonitorQuantity] = useState(1);
  const [monitorTypeSearchQuery, setMonitorTypeSearchQuery] = useState("");
  const [monitorBrandSearchQuery, setMonitorBrandSearchQuery] = useState("");
  const [monitorModelSearchQuery, setMonitorModelSearchQuery] = useState("");
  const [editingMonitorId, setEditingMonitorId] = useState<string | null>(null);

  // For personnel form
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personEmail, setPersonEmail] = useState("");

  // State to track if dropdowns are open
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

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

      // Initialize monitors array if it exists
      console.log(
        "Loading monitors from technicalInfo:",
        technicalInfo.monitors
      );
      if (Array.isArray(technicalInfo.monitors)) {
        setMonitors(technicalInfo.monitors);
      } else {
        setMonitors([]);
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
      setMonitors([]);
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
      JSON.stringify(personnel) !== JSON.stringify(technicalInfo.personnel) ||
      // For monitors, check if the array has changed in length or content
      monitors.length !== (technicalInfo.monitors?.length || 0) ||
      JSON.stringify(monitors) !== JSON.stringify(technicalInfo.monitors || [])
    ) {
      console.log("Saving technical info with monitors:", monitors);
      const newTechnicalInfo: TechnicalInfo = {
        projectTitle,
        personnel,
        generalInfo,
        houseSystem,
        mixingDesk: finalMixingDesks,
        monitors, // Explicitly include monitors in the saved data
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

  // Add or update a monitor
  const addMonitor = () => {
    if (monitorType && monitorQuantity > 0) {
      const brandModelText =
        monitorBrand && monitorModel
          ? `${monitorBrand} ${monitorModel}`
          : monitorBrand || "";

      const monitorData = {
        brand: monitorBrand,
        type: monitorType + (brandModelText ? ` (${brandModelText})` : ""),
        quantity: monitorQuantity,
      };

      if (editingMonitorId) {
        // Update existing monitor
        setMonitors(
          monitors.map((monitor) =>
            monitor.id === editingMonitorId
              ? { ...monitor, ...monitorData }
              : monitor
          )
        );
        setEditingMonitorId(null);
      } else {
        // Add new monitor
        const newMonitor: MonitorItem = {
          id: uuidv4(),
          ...monitorData,
        };
        setMonitors([...monitors, newMonitor]);
      }

      // Reset form fields
      resetMonitorForm();
    }
  };

  // Reset monitor form fields
  const resetMonitorForm = () => {
    setMonitorType("");
    setMonitorBrand("");
    setMonitorModel("");
    setMonitorQuantity(1);
    setMonitorTypeSearchQuery("");
    setMonitorBrandSearchQuery("");
    setMonitorModelSearchQuery("");
    setEditingMonitorId(null);
  };

  // Start editing a monitor
  const editMonitor = (monitor: MonitorItem) => {
    // Extract type and possibly brand and model from the monitor.type
    let extractedType = monitor.type;
    let extractedBrand = monitor.brand || "";
    let extractedModel = "";

    // Check if the type contains brand/model information in parentheses
    const matches = monitor.type.match(/(.*?)\s*\((.*)\)/);
    if (matches && matches.length > 2) {
      extractedType = matches[1].trim();
      const brandModelText = matches[2].trim();

      // If we have a brand from the monitor object, use it
      if (monitor.brand) {
        // Try to extract model by removing brand from brandModelText
        if (brandModelText.startsWith(monitor.brand)) {
          extractedModel = brandModelText
            .substring(monitor.brand.length)
            .trim();
        }
      } else {
        // Try to extract brand and model from brandModelText
        const parts = brandModelText.split(" ");
        if (parts.length > 1) {
          extractedBrand = parts[0];
          extractedModel = parts.slice(1).join(" ");
        } else {
          extractedBrand = brandModelText;
        }
      }
    }

    // Populate form with extracted values
    setMonitorType(extractedType);
    setMonitorBrand(extractedBrand);
    setMonitorModel(extractedModel);
    setMonitorQuantity(monitor.quantity);
    setEditingMonitorId(monitor.id);

    // Scroll to the form section
    document
      .getElementById("monitor-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Cancel editing
  const cancelEditing = () => {
    resetMonitorForm();
  };

  // Remove a monitor
  const removeMonitor = (id: string) => {
    setMonitors(monitors.filter((monitor) => monitor.id !== id));
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
    monitors, // Explicitly include monitors in dependencies
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

  // Handler for selecting a monitor type
  const handleMonitorTypeSelect = (type: string) => {
    setMonitorType(type);
    setMonitorTypeSearchQuery("");
    setIsTypeDropdownOpen(false);
    // Clear brand and model when type changes
    setMonitorBrand("");
    setMonitorModel("");
    setMonitorBrandSearchQuery("");
    setMonitorModelSearchQuery("");
  };

  // Handler for selecting a monitor brand
  const handleMonitorBrandSelect = (brand: string) => {
    setMonitorBrand(brand);
    setMonitorBrandSearchQuery("");
    setIsBrandDropdownOpen(false);
    // Clear model when brand changes
    setMonitorModel("");
    setMonitorModelSearchQuery("");
  };

  // Handler for selecting a monitor model
  const handleMonitorModelSelect = (model: string) => {
    setMonitorModel(model);
    setMonitorModelSearchQuery("");
    setIsModelDropdownOpen(false);
  };

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

        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", fontWeight: 300 }}>Monitors</h3>

          {/* Monitor table */}
          {monitors.length > 0 && (
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Brand</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>
                    Type/Model
                  </th>
                  <th style={{ padding: "8px", textAlign: "center" }}>
                    Quantity
                  </th>
                  <th style={{ padding: "8px", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((monitor) => (
                  <tr
                    key={monitor.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor:
                        editingMonitorId === monitor.id
                          ? "rgba(52, 152, 219, 0.1)"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: "8px" }}>{monitor.brand}</td>
                    <td style={{ padding: "8px" }}>{monitor.type}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {monitor.quantity}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => editMonitor(monitor)}
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
                          }}
                          title="Edit monitor"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeMonitor(monitor.id)}
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
                          }}
                          title="Remove monitor"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add monitor form */}
          <div
            id="monitor-form"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
              alignItems: "flex-start",
              backgroundColor: editingMonitorId
                ? "rgba(52, 152, 219, 0.05)"
                : "transparent",
              padding: editingMonitorId ? "15px" : "0",
              borderRadius: "4px",
            }}
          >
            {/* Monitor Type Dropdown (First and required) */}
            <div style={{ flex: "1", minWidth: "150px", position: "relative" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
              >
                Type (required):
              </label>
              <input
                type="text"
                value={monitorType || monitorTypeSearchQuery}
                onChange={(e) => {
                  setMonitorTypeSearchQuery(e.target.value);
                  setMonitorType(e.target.value);
                }}
                placeholder="Monitor type (e.g., Wedge, IEM)"
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                }}
                onFocus={() => {
                  setIsTypeDropdownOpen(true);
                  // Always show all options on focus
                  setMonitorTypeSearchQuery("");
                }}
                onBlur={() => {
                  setTimeout(() => setIsTypeDropdownOpen(false), 200);
                }}
              />
              {/* Dropdown button */}
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "calc(50% + 11px)",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "16px",
                }}
                onClick={() => {
                  setIsTypeDropdownOpen(!isTypeDropdownOpen);
                  if (!isTypeDropdownOpen) {
                    // Always show all options when opening dropdown
                    setMonitorTypeSearchQuery("");
                  }
                }}
              >
                ▼
              </div>
              {/* Dropdown for monitor types */}
              {isTypeDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {MONITOR_TYPES.filter((type) =>
                    type
                      .toLowerCase()
                      .includes(monitorTypeSearchQuery.toLowerCase())
                  ).map((type) => (
                    <div
                      key={type}
                      style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "white",
                        backgroundColor:
                          type === monitorType
                            ? "rgba(52, 152, 219, 0.3)"
                            : "transparent",
                      }}
                      onClick={() => handleMonitorTypeSelect(type)}
                    >
                      {type}
                    </div>
                  ))}
                  {MONITOR_TYPES.filter((type) =>
                    type
                      .toLowerCase()
                      .includes(monitorTypeSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div
                      style={{
                        padding: "8px",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      No matching types. Using custom value.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Dropdown (optional) */}
            <div style={{ flex: "1", minWidth: "150px", position: "relative" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
              >
                Brand (optional):
              </label>
              <input
                type="text"
                value={monitorBrand || monitorBrandSearchQuery}
                onChange={(e) => {
                  setMonitorBrandSearchQuery(e.target.value);
                  setMonitorBrand(e.target.value);
                }}
                placeholder="Brand name (e.g., JBL)"
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                }}
                onFocus={() => {
                  setIsBrandDropdownOpen(true);
                  // Always show all options on focus
                  setMonitorBrandSearchQuery("");
                }}
                onBlur={() => {
                  setTimeout(() => setIsBrandDropdownOpen(false), 200);
                }}
              />
              {/* Dropdown button */}
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "calc(50% + 11px)",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "16px",
                }}
                onClick={() => {
                  setIsBrandDropdownOpen(!isBrandDropdownOpen);
                  if (!isBrandDropdownOpen) {
                    // Always show all options when opening dropdown
                    setMonitorBrandSearchQuery("");
                  }
                }}
              >
                ▼
              </div>
              {/* Dropdown for brands */}
              {isBrandDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {MONITOR_BRAND_NAMES.filter((brand) =>
                    brand
                      .toLowerCase()
                      .includes(monitorBrandSearchQuery.toLowerCase())
                  ).map((brand) => (
                    <div
                      key={brand}
                      style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "white",
                        backgroundColor:
                          brand === monitorBrand
                            ? "rgba(52, 152, 219, 0.3)"
                            : "transparent",
                      }}
                      onClick={() => handleMonitorBrandSelect(brand)}
                    >
                      {brand}
                    </div>
                  ))}
                  {MONITOR_BRAND_NAMES.filter((brand) =>
                    brand
                      .toLowerCase()
                      .includes(monitorBrandSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div
                      style={{
                        padding: "8px",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      No matching brands. Using custom value.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Dropdown - only relevant if a brand is selected */}
            <div style={{ flex: "1", minWidth: "150px", position: "relative" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
              >
                Model (optional):
              </label>
              <input
                type="text"
                value={monitorModel || monitorModelSearchQuery}
                onChange={(e) => {
                  setMonitorModelSearchQuery(e.target.value);
                  setMonitorModel(e.target.value);
                }}
                placeholder={
                  monitorBrand
                    ? `Model for ${monitorBrand}`
                    : "Model (select brand first)"
                }
                disabled={!monitorBrand}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  opacity: !monitorBrand ? 0.7 : 1,
                }}
                onFocus={() => {
                  if (monitorBrand) {
                    setIsModelDropdownOpen(true);
                    // Always show all options on focus
                    setMonitorModelSearchQuery("");
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setIsModelDropdownOpen(false), 200);
                }}
              />
              {/* Dropdown button - only shown if brand is selected */}
              {monitorBrand && (
                <div
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "calc(50% + 11px)",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "16px",
                  }}
                  onClick={() => {
                    if (monitorBrand) {
                      setIsModelDropdownOpen(!isModelDropdownOpen);
                      if (!isModelDropdownOpen) {
                        // Always show all options when opening dropdown
                        setMonitorModelSearchQuery("");
                      }
                    }
                  }}
                >
                  ▼
                </div>
              )}
              {/* Dropdown for monitor models */}
              {monitorBrand && isModelDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {MONITOR_BRANDS[monitorBrand] &&
                    MONITOR_BRANDS[monitorBrand]
                      .filter((model) =>
                        model
                          .toLowerCase()
                          .includes(monitorModelSearchQuery.toLowerCase())
                      )
                      .map((model) => (
                        <div
                          key={model}
                          style={{
                            padding: "8px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "white",
                            backgroundColor:
                              model === monitorModel
                                ? "rgba(52, 152, 219, 0.3)"
                                : "transparent",
                          }}
                          onClick={() => handleMonitorModelSelect(model)}
                        >
                          {model}
                        </div>
                      ))}
                  {(!MONITOR_BRANDS[monitorBrand] ||
                    MONITOR_BRANDS[monitorBrand].filter((model) =>
                      model
                        .toLowerCase()
                        .includes(monitorModelSearchQuery.toLowerCase())
                    ).length === 0) && (
                    <div
                      style={{
                        padding: "8px",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      No matching models. Using custom value.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity input */}
            <div style={{ width: "100px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
              >
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={monitorQuantity}
                onChange={(e) =>
                  setMonitorQuantity(parseInt(e.target.value) || 1)
                }
                placeholder="Quantity"
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

            {/* Add/Update and Cancel buttons */}
            <div style={{ width: editingMonitorId ? "200px" : "150px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "12px",
                  opacity: 0,
                }}
              >
                Actions
              </label>
              <div style={{ display: "flex", gap: "10px", height: "35px" }}>
                <button
                  onClick={addMonitor}
                  disabled={!monitorType || monitorQuantity < 1}
                  style={{
                    flex: "1",
                    padding: "8px 10px",
                    backgroundColor:
                      !monitorType || monitorQuantity < 1
                        ? "rgba(52, 152, 219, 0.3)"
                        : "rgba(52, 152, 219, 0.8)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      !monitorType || monitorQuantity < 1
                        ? "not-allowed"
                        : "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "14px",
                  }}
                >
                  {editingMonitorId ? "Update" : "Add"}
                </button>

                {editingMonitorId && (
                  <button
                    onClick={cancelEditing}
                    style={{
                      flex: "1",
                      padding: "8px 10px",
                      backgroundColor: "rgba(150, 150, 150, 0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "14px",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <label
            htmlFor="monitoring"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Additional Monitoring Notes:
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
            placeholder="Enter additional monitoring details"
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

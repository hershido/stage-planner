import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { DraggableItem } from "../types/stage";
import guitarIcon from "../assets/icons/guitar.svg";
import guitarPlayerMale from "../assets/icons/guitarPlayerMale.svg";
import guitarPlayerFemale from "../assets/icons/guitarPlayerFemale.svg";
import speakerIcon from "../assets/icons/speaker.svg";
import bassPlayerMale from "../assets/icons/bassPlayerMale.svg";
import bassPlayerFemale from "../assets/icons/bassPlayerFemale.svg";
import drumPlayerMale from "../assets/icons/drumPlayerMale.svg";
import drumPlayerFemale from "../assets/icons/drumPlayerFemale.svg";
import keyboardPlayerMale from "../assets/icons/keyboardPlayerMale.svg";
import keyboardPlayerFemale from "../assets/icons/keyboardPlayerFemale.svg";
import vocalistMale from "../assets/icons/vocalistMale.svg";
import vocalistFemale from "../assets/icons/vocalistFemale.svg";
import guitarAmpMarshallStack from "../assets/icons/guitarAmpMarshallStack.svg";
import guitarAmpFenderCombo from "../assets/icons/guitarAmpFenderCombo.svg";
import bassAmpSvtStack from "../assets/icons/bassAmpSvtStack.svg";
import bassAmpCombo from "../assets/icons/bassAmpCombo.svg";
import electricDropTwoSockets from "../assets/icons/electricDrop2Sockets.svg";
import electricDropFourSockets from "../assets/icons/electricDrop4Sockets.svg";
import monoDIBox from "../assets/icons/monoDIBox.svg";
import stereoDIBox from "../assets/icons/stereoDIBox.svg";
import iemMonitor from "../assets/icons/iemMonitor.svg";
import wedgeMonitor from "../assets/icons/wedgeMonitor.svg";
// These should match the types in Stage.tsx
const ItemTypes = {
  STAGE_ITEM: "stage-item",
  SIDEBAR_ITEM: "sidebar-item",
};

interface DraggableItemProps {
  item: DraggableItem;
  onClick: (item: DraggableItem) => void;
}

const DraggableItemComponent: React.FC<DraggableItemProps> = ({
  item,
  onClick,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: item.type, // Using the category ('instruments' or 'equipment') as the type for filtering in sidebar
    item: () => {
      console.log("Dragging from sidebar:", item);
      return {
        ...item,
        name: item.name,
        icon: item.icon,
        sourceType: ItemTypes.SIDEBAR_ITEM, // Adding a sourceType to identify it's from sidebar
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      console.log("Sidebar drag ended:", dropResult);
    },
  }));

  const handleClick = () => {
    console.log("Item clicked in sidebar:", item);
    onClick(item);
  };

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      onClick={handleClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "pointer",
        padding: "8px",
        margin: "4px",
        border: "1px solid #555",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background-color 0.2s ease",
        backgroundColor: "#ffffff",
        color: "#333333",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
      className="sidebar-item"
    >
      <img
        src={item.icon}
        alt={item.name}
        style={{ width: "24px", height: "24px" }}
      />
      <span>{item.name}</span>
    </div>
  );
};

interface CategoryProps {
  title: string;
  items: DraggableItem[];
  onItemClick: (item: DraggableItem) => void;
  level?: "main" | "sub";
  isSearching?: boolean;
}

const Category: React.FC<CategoryProps> = ({
  title,
  items,
  onItemClick,
  level = "main",
  isSearching = false,
}) => {
  // Remember the user's manually set state
  const [userExpandedState, setUserExpandedState] = useState(false);
  // Combined state of search-triggered and user-triggered expansion
  const [isExpanded, setIsExpanded] = useState(isSearching && items.length > 0);

  // Update expansion state when search status changes
  useEffect(() => {
    if (isSearching && items.length > 0) {
      // Expand when searching and we have results
      setIsExpanded(true);
    } else if (!isSearching) {
      // When not searching, use the user's last manual setting
      setIsExpanded(userExpandedState);
    }
  }, [isSearching, items.length, userExpandedState]);

  // Handle manual toggle
  const handleToggle = () => {
    const newState = !isExpanded;
    setUserExpandedState(newState);
    setIsExpanded(newState);
  };

  // Different styles based on level
  const headerStyle = {
    color: "#ffffff",
    backgroundColor: level === "main" ? "#444444" : "#555555",
    padding: level === "main" ? "8px 12px" : "6px 12px 6px 24px",
    borderRadius: "4px",
    marginBottom: isExpanded ? "8px" : "0",
    marginLeft: level === "sub" ? "12px" : "0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none" as const,
    fontSize: level === "sub" ? "14px" : undefined,
  };

  return (
    <div style={{ marginBottom: level === "main" ? "16px" : "12px" }}>
      <div onClick={handleToggle} style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: level === "sub" ? "15px" : "16px" }}>
          {title}
        </h3>
        <span style={{ fontSize: level === "sub" ? "16px" : "18px" }}>
          {isExpanded ? "▼" : "►"}
        </span>
      </div>

      {isExpanded && (
        <div
          style={{
            maxHeight: "250px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            marginLeft: level === "sub" ? "12px" : "0",
          }}
        >
          {items.map((item) => (
            <DraggableItemComponent
              key={item.name}
              item={item}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Equipment category component with subcategories
const EquipmentCategory: React.FC<{
  speakerItems: DraggableItem[];
  guitarAmpItems: DraggableItem[];
  bassAmpItems: DraggableItem[];
  stageGearItems: DraggableItem[];
  monitorItems: DraggableItem[];
  onItemClick: (item: DraggableItem) => void;
  isSearching: boolean;
}> = ({
  speakerItems,
  guitarAmpItems,
  bassAmpItems,
  stageGearItems,
  monitorItems,
  onItemClick,
  isSearching,
}) => {
  // Initialize as expanded if searching and there are matching items
  const [isExpanded, setIsExpanded] = useState(
    isSearching &&
      (speakerItems.length > 0 ||
        guitarAmpItems.length > 0 ||
        bassAmpItems.length > 0 ||
        stageGearItems.length > 0 ||
        monitorItems.length > 0)
  );

  // Update expansion state when search status changes
  useEffect(() => {
    if (
      isSearching &&
      (speakerItems.length > 0 ||
        guitarAmpItems.length > 0 ||
        bassAmpItems.length > 0 ||
        stageGearItems.length > 0 ||
        monitorItems.length > 0)
    ) {
      setIsExpanded(true);
    }
  }, [
    isSearching,
    speakerItems.length,
    guitarAmpItems.length,
    bassAmpItems.length,
    stageGearItems.length,
    monitorItems.length,
  ]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          color: "#ffffff",
          backgroundColor: "#444444",
          padding: "8px 12px",
          borderRadius: "4px",
          marginBottom: isExpanded ? "8px" : "0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none" as const,
        }}
      >
        <h3 style={{ margin: 0 }}>Equipment</h3>
        <span style={{ fontSize: "18px" }}>{isExpanded ? "▼" : "►"}</span>
      </div>

      {isExpanded && (
        <>
          {speakerItems.length > 0 && (
            <Category
              title="Speakers"
              items={speakerItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
            />
          )}

          {guitarAmpItems.length > 0 && (
            <Category
              title="Guitar Amps"
              items={guitarAmpItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
            />
          )}

          {bassAmpItems.length > 0 && (
            <Category
              title="Bass Amps"
              items={bassAmpItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
            />
          )}

          {monitorItems.length > 0 && (
            <Category
              title="Monitors"
              items={monitorItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
            />
          )}

          {stageGearItems.length > 0 && (
            <Category
              title="Stage Gear"
              items={stageGearItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
            />
          )}
        </>
      )}
    </div>
  );
};

interface SidebarProps {
  onItemClick: (item: DraggableItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const items: DraggableItem[] = [
    // Instruments
    {
      type: "instruments",
      name: "Guitar",
      icon: guitarIcon,
      defaultWidth: 80,
      defaultHeight: 200,
    },
    {
      type: "instruments",
      name: "Acoustic Guitar",
      icon: guitarIcon,
      defaultWidth: 80,
      defaultHeight: 200,
    },

    // Equipment - Speakers
    {
      type: "equipment",
      subtype: "speakers",
      name: "Speaker",
      icon: speakerIcon,
      defaultWidth: 100,
      defaultHeight: 180,
    },

    // Equipment - Guitar Amps
    {
      type: "equipment",
      subtype: "guitarAmps",
      name: "Marshall Stack",
      icon: guitarAmpMarshallStack,
      defaultWidth: 120,
      defaultHeight: 200,
    },
    {
      type: "equipment",
      subtype: "guitarAmps",
      name: "Fender Combo",
      icon: guitarAmpFenderCombo,
      defaultWidth: 100,
      defaultHeight: 120,
    },

    // Equipment - Bass Amps
    {
      type: "equipment",
      subtype: "bassAmps",
      name: "SVT Stack",
      icon: bassAmpSvtStack,
      defaultWidth: 120,
      defaultHeight: 200,
    },
    {
      type: "equipment",
      subtype: "bassAmps",
      name: "Bass Combo",
      icon: bassAmpCombo,
      defaultWidth: 100,
      defaultHeight: 120,
    },

    // Equipment - Monitors
    {
      type: "equipment",
      subtype: "monitors",
      name: "IEM Monitor",
      icon: iemMonitor,
      defaultWidth: 60,
      defaultHeight: 60,
    },
    {
      type: "equipment",
      subtype: "monitors",
      name: "Wedge Monitor",
      icon: wedgeMonitor,
      defaultWidth: 150,
      defaultHeight: 100,
    },

    // Equipment - Stage Gear
    {
      type: "equipment",
      subtype: "stageGear",
      name: "Electric Drop Two Sockets",
      icon: electricDropTwoSockets,
      defaultWidth: 70,
      defaultHeight: 70,
    },
    {
      type: "equipment",
      subtype: "stageGear",
      name: "Electric Drop Four Sockets",
      icon: electricDropFourSockets,
      defaultWidth: 120,
      defaultHeight: 70,
    },
    {
      type: "equipment",
      subtype: "stageGear",
      name: "Mono DI Box",
      icon: monoDIBox,
      defaultWidth: 80,
      defaultHeight: 60,
    },
    {
      type: "equipment",
      subtype: "stageGear",
      name: "Stereo DI Box",
      icon: stereoDIBox,
      defaultWidth: 100,
      defaultHeight: 60,
    },

    // Musicians - Guitarists
    {
      type: "musicians",
      name: "Male Guitarist",
      icon: guitarPlayerMale,
      defaultWidth: 120,
      defaultHeight: 170,
    },
    {
      type: "musicians",
      name: "Female Guitarist",
      icon: guitarPlayerFemale,
      defaultWidth: 120,
      defaultHeight: 170,
    },

    // Musicians - Bassists
    {
      type: "musicians",
      name: "Male Bassist",
      icon: bassPlayerMale,
      defaultWidth: 120,
      defaultHeight: 170,
    },
    {
      type: "musicians",
      name: "Female Bassist",
      icon: bassPlayerFemale,
      defaultWidth: 120,
      defaultHeight: 170,
    },

    // Musicians - Keyboard Players
    {
      type: "musicians",
      name: "Male Keyboard Player",
      icon: keyboardPlayerMale,
      defaultWidth: 180,
      defaultHeight: 160,
    },
    {
      type: "musicians",
      name: "Female Keyboard Player",
      icon: keyboardPlayerFemale,
      defaultWidth: 180,
      defaultHeight: 160,
    },

    // Musicians - Singers
    {
      type: "musicians",
      name: "Male Vocalist",
      icon: vocalistMale,
      defaultWidth: 100,
      defaultHeight: 170,
    },
    {
      type: "musicians",
      name: "Female Vocalist",
      icon: vocalistFemale,
      defaultWidth: 100,
      defaultHeight: 170,
    },

    // Musicians - Drummers
    {
      type: "musicians",
      name: "Male Drummer",
      icon: drumPlayerMale,
      defaultWidth: 180,
      defaultHeight: 150,
    },
    {
      type: "musicians",
      name: "Female Drummer",
      icon: drumPlayerFemale,
      defaultWidth: 180,
      defaultHeight: 150,
    },
  ];

  const filteredItems =
    searchTerm.trim() === ""
      ? items
      : items.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const instrumentItems = filteredItems.filter(
    (item) => item.type === "instruments"
  );

  // Equipment items
  const equipmentItems = filteredItems.filter(
    (item) => item.type === "equipment"
  );

  // Equipment subtypes
  const speakerItems = equipmentItems.filter(
    (item) => item.subtype === "speakers"
  );

  const guitarAmpItems = equipmentItems.filter(
    (item) => item.subtype === "guitarAmps"
  );

  const bassAmpItems = equipmentItems.filter(
    (item) => item.subtype === "bassAmps"
  );

  const stageGearItems = equipmentItems.filter(
    (item) => item.subtype === "stageGear"
  );

  const monitorItems = equipmentItems.filter(
    (item) => item.subtype === "monitors"
  );

  const musicianItems = filteredItems.filter(
    (item) => item.type === "musicians"
  );

  return (
    <div
      style={{
        width: "200px",
        padding: "16px",
        borderRight: "1px solid #555",
        backgroundColor: "#333333",
        color: "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ marginBottom: "16px", color: "#ffffff", fontSize: "20px" }}>
        Items
      </h2>

      {/* Search input */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #555",
            backgroundColor: "#444444",
            color: "white",
            outline: "none",
          }}
        />
      </div>

      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        {instrumentItems.length > 0 && (
          <Category
            title="Instruments"
            items={instrumentItems}
            onItemClick={onItemClick}
            isSearching={searchTerm.trim() !== ""}
          />
        )}

        {equipmentItems.length > 0 && (
          <EquipmentCategory
            speakerItems={speakerItems}
            guitarAmpItems={guitarAmpItems}
            bassAmpItems={bassAmpItems}
            stageGearItems={stageGearItems}
            monitorItems={monitorItems}
            onItemClick={onItemClick}
            isSearching={searchTerm.trim() !== ""}
          />
        )}

        {musicianItems.length > 0 && (
          <Category
            title="Musicians"
            items={musicianItems}
            onItemClick={onItemClick}
            isSearching={searchTerm.trim() !== ""}
          />
        )}

        {filteredItems.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "20px 0", color: "#999" }}
          >
            No items found
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

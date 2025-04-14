import React, { useState, useEffect, useRef } from "react";
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
import acousticGuitarOnStand from "../assets/icons/acousticGuitarOnStand.svg";
import bassGuitarOnStand from "../assets/icons/bassGuitarOnStand.svg";
import laptopWithAudioInterfaceOnStand from "../assets/icons/laptopWithAudioInterfaceOnStand.svg";
import drummerMixer from "../assets/icons/drummerMixer.svg";
import textLabel from "../assets/icons/textLabel.svg";
import stickerLabel from "../assets/icons/stickerLabel.svg";
import appLogo from "../assets/icons/appLogo.svg";
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
    end: (_item, monitor) => {
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
        padding: "8px 5px",
        border: "1px solid #555",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        backgroundColor: "#ffffff",
        color: "#333333",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        width: "calc(33.333% - 8px)",
        margin: "4px",
        height: "90px",
      }}
      className="sidebar-item"
    >
      <img
        src={item.icon}
        alt={item.name}
        style={{
          width: "32px",
          height: "32px",
          marginBottom: "6px",
          objectFit: "contain",
        }}
      />
      <span
        style={{
          fontSize: "11px",
          textAlign: "center",
          lineHeight: "1.2",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          maxWidth: "100%",
          padding: "0 2px",
          wordBreak: "break-word",
        }}
      >
        {item.name}
      </span>
    </div>
  );
};

interface CategoryProps {
  title: string;
  items: DraggableItem[];
  onItemClick: (item: DraggableItem) => void;
  level?: "main" | "sub";
  isSearching?: boolean;
  icon?: string;
}

const Category: React.FC<CategoryProps> = ({
  title,
  items,
  onItemClick,
  level = "main",
  isSearching = false,
  icon,
}) => {
  // Remember the user's manually set state
  const [userExpandedState, setUserExpandedState] = useState(false);
  // Combined state of search-triggered and user-triggered expansion
  const [isExpanded, setIsExpanded] = useState(isSearching && items.length > 0);
  // Track scroll states
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  // Reference to scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Check scroll position to determine if fades should be shown
  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      const checkScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current!;
        setCanScrollUp(scrollTop > 0);
        setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
      };

      // Initial check
      checkScroll();

      // Add scroll event listener
      scrollContainerRef.current.addEventListener("scroll", checkScroll);

      // Cleanup
      return () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener("scroll", checkScroll);
        }
      };
    }
  }, [isExpanded, items]);

  // Check if enough items to show fades
  const shouldShowFades = items.length >= 9;

  // Handle manual toggle
  const handleToggle = () => {
    const newState = !isExpanded;
    setUserExpandedState(newState);
    setIsExpanded(newState);
  };

  return (
    <div style={{ marginBottom: level === "main" ? "16px" : "12px" }}>
      <div
        onClick={handleToggle}
        className={`sidebar-category-header ${
          level === "sub" ? "sidebar-subcategory-header" : ""
        }`}
      >
        <div className="header-content">
          {icon && <img src={icon} alt="" className="category-icon" />}
          <h3>{title}</h3>
        </div>
        <div
          className={`toggle-icon ${isExpanded ? "expanded" : "collapsed"}`}
        ></div>
      </div>

      {isExpanded && (
        <div className="scroll-container-wrapper">
          <div
            className={`fade-top ${
              shouldShowFades && canScrollUp ? "visible" : ""
            }`}
          ></div>
          <div ref={scrollContainerRef} className="scrollable-container">
            <div className="sidebar-grid-container">
              {items.map((item) => (
                <DraggableItemComponent
                  key={item.name}
                  item={item}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </div>
          <div
            className={`fade-bottom ${
              shouldShowFades && canScrollDown ? "visible" : ""
            }`}
          ></div>
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
  icon?: string;
}> = ({
  speakerItems,
  guitarAmpItems,
  bassAmpItems,
  stageGearItems,
  monitorItems,
  onItemClick,
  isSearching,
  icon,
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
        className="sidebar-category-header"
      >
        <div className="header-content">
          {icon && <img src={icon} alt="" className="category-icon" />}
          <h3>Equipment</h3>
        </div>
        <div
          className={`toggle-icon ${isExpanded ? "expanded" : "collapsed"}`}
        ></div>
      </div>

      {isExpanded && (
        <>
          {guitarAmpItems.length > 0 && (
            <Category
              title="Guitar Amps"
              items={guitarAmpItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
              icon={guitarAmpMarshallStack}
            />
          )}

          {bassAmpItems.length > 0 && (
            <Category
              title="Bass Amps"
              items={bassAmpItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
              icon={bassAmpSvtStack}
            />
          )}

          {monitorItems.length > 0 && (
            <Category
              title="Monitors"
              items={monitorItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
              icon={iemMonitor}
            />
          )}

          {stageGearItems.length > 0 && (
            <Category
              title="Stage Gear"
              items={stageGearItems}
              onItemClick={onItemClick}
              level="sub"
              isSearching={isSearching}
              icon={electricDropTwoSockets}
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
    {
      type: "instruments",
      name: "Acoustic Guitar On Stand",
      icon: acousticGuitarOnStand,
      defaultWidth: 50,
      defaultHeight: 120,
    },
    {
      type: "instruments",
      name: "Bass Guitar On Stand",
      icon: bassGuitarOnStand,
      defaultWidth: 60,
      defaultHeight: 150,
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
    {
      type: "equipment",
      subtype: "monitors",
      name: "Drummer Mixer",
      icon: drummerMixer,
      defaultWidth: 120,
      defaultHeight: 80,
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
    {
      type: "equipment",
      subtype: "stageGear",
      name: "Laptop with Audio Interface",
      icon: laptopWithAudioInterfaceOnStand,
      defaultWidth: 90,
      defaultHeight: 120,
    },

    // Labels
    {
      type: "labels",
      name: "Text Label",
      icon: textLabel,
      defaultWidth: 120,
      defaultHeight: 40,
    },
    {
      type: "labels",
      name: "Sticker Label",
      icon: stickerLabel,
      defaultWidth: 150,
      defaultHeight: 50,
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

  // Labels items
  const labelItems = filteredItems.filter((item) => item.type === "labels");

  const musicianItems = filteredItems.filter(
    (item) => item.type === "musicians"
  );

  return (
    <div
      style={{
        width: "330px",
        padding: 0,
        borderRight: "1px solid #222",
        backgroundColor: "#272727",
        color: "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Roboto Mono', monospace",
      }}
    >
      <div className="sidebar-app-logo">
        <img src={appLogo} alt="Stage Planner" />
      </div>

      <div className="sidebar-inner-content">
        <h2
          style={{
            marginBottom: "16px",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "400",
            textAlign: "center",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          Items
        </h2>

        {/* Search input */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "3px",
              border: "1px solid #555",
              backgroundColor: "#2a2a2a",
              color: "white",
              outline: "none",
              fontSize: "14px",
              fontFamily: "'Roboto Mono', monospace",
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
              icon={acousticGuitarOnStand}
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
              icon={drummerMixer}
            />
          )}

          {labelItems.length > 0 && (
            <Category
              title="Labels"
              items={labelItems}
              onItemClick={onItemClick}
              isSearching={searchTerm.trim() !== ""}
              icon={textLabel}
            />
          )}

          {musicianItems.length > 0 && (
            <Category
              title="Musicians"
              items={musicianItems}
              onItemClick={onItemClick}
              isSearching={searchTerm.trim() !== ""}
              icon={vocalistMale}
            />
          )}

          {filteredItems.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: "#aaa",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "6px",
                margin: "10px 0",
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>🔍</div>
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

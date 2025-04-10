import React from "react";
import { useDrag } from "react-dnd";
import { DraggableItem } from "../types/stage";
import guitarIcon from "../assets/icons/guitar.svg";
import speakerIcon from "../assets/icons/speaker.svg";

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
        border: "1px solid #ccc",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background-color 0.2s ease",
        backgroundColor: "#f9f9f9",
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

interface SidebarProps {
  onItemClick: (item: DraggableItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const items: DraggableItem[] = [
    {
      type: "instruments",
      name: "Guitar",
      icon: guitarIcon,
    },
    {
      type: "equipment",
      name: "Speaker",
      icon: speakerIcon,
    },
  ];

  return (
    <div
      style={{ width: "200px", padding: "16px", borderRight: "1px solid #ccc" }}
    >
      <h2>Items</h2>
      <div>
        <h3>Instruments</h3>
        {items
          .filter((item) => item.type === "instruments")
          .map((item) => (
            <DraggableItemComponent
              key={item.name}
              item={item}
              onClick={onItemClick}
            />
          ))}
      </div>
      <div>
        <h3>Equipment</h3>
        {items
          .filter((item) => item.type === "equipment")
          .map((item) => (
            <DraggableItemComponent
              key={item.name}
              item={item}
              onClick={onItemClick}
            />
          ))}
      </div>
    </div>
  );
};

export default Sidebar;

export type Category = "instruments" | "equipment";

export interface StageItem {
  id: string;
  name: string;
  category: Category;
  icon: string;
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
}

export interface StageConfig {
  width: number;
  height: number;
  items: StageItem[];
}

export interface DraggableItem {
  id?: string; // Optional ID since new items from sidebar don't have IDs yet
  type: Category;
  name: string;
  icon: string;
  sourceType?: string; // To identify where the item is being dragged from
}

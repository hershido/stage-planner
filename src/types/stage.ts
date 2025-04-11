export type Category = "instruments" | "equipment" | "musicians";

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
  isFlipped?: boolean;
}

export interface InputRow {
  id: string;
  number: string | number;
  name: string;
  channelType: string;
  standType: string;
}

export interface OutputRow {
  id: string;
  number: string | number;
  name: string;
  channelType: string;
  standType: string;
}

export interface StageInputOutput {
  inputs: InputRow[];
  outputs: OutputRow[];
}

export interface StageConfig {
  width: number;
  height: number;
  items: StageItem[];
  inputOutput?: StageInputOutput;
}

export interface DraggableItem {
  id?: string; // Optional ID since new items from sidebar don't have IDs yet
  type: Category;
  subtype?: string; // Optional subcategory for further classification
  name: string;
  icon: string;
  sourceType?: string; // To identify where the item is being dragged from
  defaultWidth?: number; // Default width when dropped on stage
  defaultHeight?: number; // Default height when dropped on stage
}

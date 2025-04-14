export type Category = "instruments" | "equipment" | "musicians" | "labels";

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
  zIndex?: number; // Control the stacking order of items
  textContent?: string; // Text content for text label items
  textFormatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    fontSize?: number; // Font size in pixels
    textColor?: string; // Text color in CSS color format
  };
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
  monitorType: string;
}

export interface StageInputOutput {
  inputs: InputRow[];
  outputs: OutputRow[];
}

export interface Person {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface TechnicalInfo {
  projectTitle: string;
  personnel: Person[];
  generalInfo: string;
  houseSystem: string;
  mixingDesk: string[] | string;
  monitoring: string;
  backline: string;
  soundCheck: string;
}

export interface StageConfig {
  width: number;
  height: number;
  items: StageItem[];
  inputOutput?: StageInputOutput;
  technicalInfo?: TechnicalInfo;
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

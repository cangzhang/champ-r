export interface RuneRoot {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Slot[];
}

export interface RuneSlot {
  runes: Rune[];
}

export interface Rune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

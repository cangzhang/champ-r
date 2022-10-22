export interface Source {
  version: string;
  Sort: number;
  source: {
    label: string;
    value: string;
    isAram: boolean;
    isUrf: boolean;
  };
  source_version: string;
}

export interface Rune {
  icon: string
  id: number
  key: string
  longDesc: string
  name: string
  shortDesc: string
}

export interface RuneSlot {
  icon: string
  id: number
  key: string
  name: string
  slots: Rune[][]
}

export interface DDragon {
  source_list: Source[];
  rune_list: RuneSlot[];
  ready: boolean;
  official_version: string;
}

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

export interface ShardSlot {
  key: string;
  shards: Shard[];
}

export interface Shard {
  id: number;
  tooltip_desc: string;
  img: string;
  name: string;
}

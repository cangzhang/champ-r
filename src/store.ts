import create from 'zustand';

import { Source } from 'src/interfaces';

interface AppCtx {
  lcuRunning: boolean;
  toggleLcuStatus: (next: boolean) => void;
  sources: Source[];
  setSources: (sources: Source[]) => void;
}

export const useAppStore = create<AppCtx>((set) => ({
  lcuRunning: false,
  toggleLcuStatus: (next) => set(() => ({ lcuRunning: next })),
  sources: [],
  setSources: (sources) => set(() => ({ sources })),
}));

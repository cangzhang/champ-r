import produce from 'immer';
import create from 'zustand';

import { Source } from 'src/interfaces';

interface AppCtx {
  lcuRunning: boolean;
  toggleLcuStatus: (next: boolean) => void;
  sources: Source[];
  setSources: (s: Source[]) => void;
}

export const useAppStore = create<AppCtx>((set) => ({
  lcuRunning: false,
  toggleLcuStatus: (next) =>
    set(
      produce((draft) => {
        draft.lcuRunning = next;
      })
    ),
  sources: [],
  setSources: (next) =>
    set(
      produce((draft) => {
        draft.sources = next;
      })
    ),
}));

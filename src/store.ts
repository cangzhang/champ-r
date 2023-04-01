import create from 'zustand'

interface AppCtx {
  lcuRunning: boolean;
  toggleLcuStatus: (next: boolean) => void;
}

export const useAppStore = create<AppCtx>((set) => ({
  lcuRunning: false,
  toggleLcuStatus: (next) => set(() => ({ lcuRunning: next })),
}));

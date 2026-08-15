import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchDashboardData, DashboardData } from '../lib/readTelemetry.js';

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  
  // Actions
  fetchTelemetry: () => Promise<void>;
  setHydrated: (val: boolean) => void;
  clearStore: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      data: null,
      loading: true,
      error: null,
      hydrated: false,

      fetchTelemetry: async () => {
        set({ loading: true, error: null });
        try {
          const payload = await fetchDashboardData();
          set({ data: payload, loading: false });
        } catch (err: any) {
          console.error(err);
          set({
            error: err.message || 'Failed to load telemetry data. Make sure "npm run dashboard:export" has been run.',
            loading: false,
          });
        }
      },

      setHydrated: (val: boolean) => set({ hydrated: val }),

      clearStore: () => set({ data: null, error: null, loading: false }),
    }),
    {
      name: 'brilliantaire-os-telemetry-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Derived state / Selectors
export const selectActiveProjects = (state: DashboardState) => state.data?.activeProjects || [];
export const selectActiveCapabilities = (state: DashboardState) => state.data?.activeCapabilities || [];
export const selectCommandSummary = (state: DashboardState) => state.data?.commandSummary || {
  totalCommands: 0,
  successfulCommands: 0,
  blockedCommands: 0,
  obsidianWrites: 0,
};
export const selectVoiceSummary = (state: DashboardState) => state.data?.voiceSummary || {
  accepted: 0,
  pending: 0,
  rejected: 0,
  approvedConfirmations: 0,
  deniedConfirmations: 0,
};
export const selectVoiceLoop = (state: DashboardState) => state.data?.voiceLoop || {
  status: 'offline',
  lastAction: 'none',
  queueLength: 0,
  lastHeard: 'never',
  activeSessionId: 'none',
};

// Derived totals selector (Derived State)
export const selectTelemetryTotals = (state: DashboardState) => {
  const cmd = selectCommandSummary(state);
  const voice = selectVoiceSummary(state);
  return {
    totalInteractions: cmd.totalCommands + voice.accepted + voice.rejected + voice.pending,
    successRate: cmd.totalCommands > 0 ? (cmd.successfulCommands / cmd.totalCommands) * 100 : 100,
  };
};

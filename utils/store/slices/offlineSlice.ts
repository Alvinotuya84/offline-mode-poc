import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

export type OfflineTriggerSource = 'network' | 'sms' | null;
export interface SyncRecord {
  timestamp: number;
  success: boolean;
  itemsSynced: number;
  error?: string;
}
export interface OfflineState {
  isOfflineMode: boolean;
  isCountDownActive: boolean;
  countDownStartTime: number | null;
  lastKnownConnection: boolean;
  syncInProgress: boolean;
  syncError: string | null;
  pendingSyncItems: number;
  offlineTriggerSouce: OfflineTriggerSource;
  lastSuccesfulSync: SyncRecord | null;
  smsTriggeredOffline: boolean;
}

const initialState: OfflineState = {
  isOfflineMode: false,
  isCountDownActive: false,
  countDownStartTime: null,
  lastKnownConnection: true,
  syncInProgress: false,
  syncError: null,
  offlineTriggerSouce: null,
  lastSuccesfulSync: null,
  smsTriggeredOffline: false,
  pendingSyncItems: 0,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    startCountDown: (state, action: PayloadAction<number>) => {
      state.isCountDownActive = true;
      state.countDownStartTime = action.payload;
    },
    cancelCountDown: state => {
      state.isCountDownActive = false;
      state.countDownStartTime = null;
    },
    enterOfflineMode: (
      state,
      action: PayloadAction<{ source: OfflineTriggerSource }>,
    ) => {
      if (!state.isOfflineMode) {
        Alert.alert('Offline Mode', 'You are about to switch to offline mode');
      }

      state.isOfflineMode = true;
      state.isCountDownActive = false;
      state.countDownStartTime = null;
      state.offlineTriggerSouce = action.payload.source;
      if (action.payload.source === 'sms') {
        state.smsTriggeredOffline = true;
      }
    },
    exitOfflineMode: (
      state,
      action: PayloadAction<{ source: OfflineTriggerSource }>,
    ) => {
      if (state.isOfflineMode)
        Alert.alert('Online Mode Restored', 'Switching back to online mode');
      state.isOfflineMode = false;
      state.offlineTriggerSouce = null;
      if (action.payload.source === 'sms') {
        state.smsTriggeredOffline = false;
      }
    },
    setLastKnownConnection: (state, action: PayloadAction<boolean>) => {
      state.lastKnownConnection = action.payload;
    },
    startSync: state => {
      state.syncInProgress = true;
      state.syncError = null;
    },
    syncSuccess: (state, action: PayloadAction<{ itemsSynced: number }>) => {
      state.syncInProgress = false;
      state.pendingSyncItems = 0;
      state.lastSuccesfulSync = {
        timestamp: Date.now(),
        success: true,
        itemsSynced: action.payload.itemsSynced,
      };
      if (!state.smsTriggeredOffline) {
        state.isOfflineMode = false;
        state.offlineTriggerSouce = null;
      }
    },
    syncFailure: (state, action: PayloadAction<string>) => {
      state.syncInProgress = false;
      state.syncError = action.payload;
    },
    setPendingItems: (state, action: PayloadAction<number>) => {
      state.pendingSyncItems = action.payload;
    },
    clearSmsTriggeredFlag: state => {
      state.smsTriggeredOffline = false;
    },
  },
});

export const {
  startCountDown,
  cancelCountDown,
  enterOfflineMode,
  exitOfflineMode,
  setLastKnownConnection,
  startSync,
  syncSuccess,
  syncFailure,
  setPendingItems,
  clearSmsTriggeredFlag,
} = offlineSlice.actions;

export default offlineSlice.reducer;

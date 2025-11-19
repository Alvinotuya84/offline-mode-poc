import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
export interface OfflineState {
  isOfflineMode: boolean;
  isCountDownActive: boolean;
  countDownStartTime: number | null;
  lastKnownConnection: boolean;
  syncInProgress: boolean;
  syncError: string | null;
  pendingSyncItems: number;
}

const initialState: OfflineState = {
  isOfflineMode: false,
  isCountDownActive: false,
  countDownStartTime: null,
  lastKnownConnection: true,
  syncInProgress: false,
  syncError: null,
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
    enterOfflineMode: state => {
      state.isOfflineMode = true;
      state.isCountDownActive = false;
      state.countDownStartTime = null;
      Alert.alert(
        'Offline Mode',
        'You are about to switch to offline mode as there has been no internet for the last 5 minutes',
      );
    },
    exitOfflineMode: state => {
      state.isOfflineMode = false;
      Alert.alert('Internet restored', 'Switching back to online mode');
    },
    setLastKnownConnection: (state, action: PayloadAction<boolean>) => {
      state.lastKnownConnection = action.payload;
    },
    startSync: state => {
      state.syncInProgress = true;
      state.syncError = null;
    },
    syncSuccess: state => {
      state.syncInProgress = false;
      state.pendingSyncItems = 0;
      state.isOfflineMode = false; // user returns to normal online swap once sync is complete and succesful
    },
    syncFailure: (state, action: PayloadAction<string>) => {
      state.syncInProgress = false;
      state.syncError = action.payload;
    },
    setPendingItems: (state, action: PayloadAction<number>) => {
      state.pendingSyncItems = action.payload;
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
} = offlineSlice.actions;

export default offlineSlice.reducer;

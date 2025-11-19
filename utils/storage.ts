import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV({
  id: `offline-mode-{sessionID}poc`,
  mode: 'multi-process',
  readOnly: false,
});
export const reduxStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    storage.remove(key);
    return Promise.resolve();
  },
};

export const STORAGE_KEYS = {
  COUNTDOWN_START: 'countdonw_start_timestamp',
  LAST_SYNC_TIME: 'last_sync_timestamp',
  CONNNECTIVITY_LOG: 'connectivity_events_log',
};

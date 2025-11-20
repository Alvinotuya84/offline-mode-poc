import { store } from '../store';
import {
  startSync,
  syncSuccess,
  setPendingItems,
  syncFailure,
} from '../store/slices/offlineSlice';
import { storage, STORAGE_KEYS } from '../storage';
import { logEvent } from '../logger';
const SYNC_DEBOUNCE_TIME = 30 * 1000;
class SyncService {
  async syncAndReturnToOnline(): Promise<boolean | null | undefined> {
    const state = store.getState();
    if (!state.offline.isOfflineMode) {
      return;
    }
    if (state.offline.smsTriggeredOffline) {
      logEvent('sync_blocked_sms_priority', {
        reason: 'SMS-triggered offline mode cannot be overridden by network',
      });
      return;
    }
    if (this.shouldSkipSync(state.offline.lastSuccesfulSync)) {
      logEvent('sync_skipped_recent_success', {
        lastSync: state.offline.lastSuccesfulSync,
      });
    }
    if (state.offline.pendingSyncItems === 0) {
      const pendingItems = await this.getPendingItems();
      if (pendingItems.length === 0) {
        logEvent('sync_skipped_no_pending_items');

        store.dispatch(syncSuccess({ itemsSynced: 0 }));
        return;
      }
    }
    store.dispatch(startSync());
    logEvent('sync_started', {
      timestamp: Date.now(),
      pendingItems: state.offline.pendingSyncItems,
    });

    try {
      const pendingItems = await this.getPendingItems();
      store.dispatch(setPendingItems(pendingItems.length));
      if (pendingItems.length === 0) {
        store.dispatch(syncSuccess({ itemsSynced: 0 }));
        logEvent('sync_completed_no_items');
        return;
      }

      for (const item of pendingItems) {
        await this.syncItem(item);
      }
      storage.set(STORAGE_KEYS.LAST_SYNC_TIME, Date.now());
      store.dispatch(syncSuccess({ itemsSynced: pendingItems.length }));
      logEvent('sync_completed', {
        timestamp: Date.now(),
        itemsSynced: pendingItems.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknwon error';
      store.dispatch(syncFailure(errorMessage));
      logEvent('sync_failed', {
        timestamp: Date.now(),
        error: errorMessage,
      });
    }
    return true;
  }
  private async getPendingItems(): Promise<any[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([]);
      }, 1000);
    });
  }
  private shouldSkipSync(
    lastSync: { timestamp: number; success: boolean } | null,
  ) {
    if (!lastSync || !lastSync.success) {
      return false;
    }
    const timeSinceLastSync = Date.now() - lastSync.timestamp;
    if (timeSinceLastSync < SYNC_DEBOUNCE_TIME) {
      return true;
    }
    return false;
  }
  private async syncItem(item: any): Promise<void> {}

  async forceSync() {
    const state = store.getState().offline;

    if (state.smsTriggeredOffline) {
      logEvent('force_sync_blocked_sms_priority');
      return;
    }

    await this.syncAndReturnToOnline();
  }
}
export default new SyncService();

import { store } from '../store';
import { storage, STORAGE_KEYS } from '../storage';
import {
  startCountDown,
  cancelCountDown,
  enterOfflineMode,
  setLastKnownConnection,
} from '../store/slices/offlineSlice';
import { logEvent } from '../logger';
import SyncService from './SyncService';

const COUNTDOWN_DURATION = 5 * 60 * 1000;
const NETWORK_CHECK_INTERVAL = 10 * 1000;

class OfflineFallbackService {
  private countdownTimer: NodeJS.Timeout | null = null;
  private networkCheckInterval: NodeJS.Timeout | null = null;
  async initialize() {
    await this.restoreCountdownState();
  }
  private async restoreCountdownState() {
    const savedStartTime = storage.getNumber(STORAGE_KEYS.COUNTDOWN_START);
    if (savedStartTime) {
      const elapsed = Date.now() - savedStartTime;
      const remaining = COUNTDOWN_DURATION - elapsed;

      logEvent('countdown_restore_check', {
        startTime: savedStartTime,
        elapsed,
        remaining,
      });
      if (remaining <= 0) {
        await this.triggerOfflineMode();
      } else {
        store.dispatch(startCountDown(savedStartTime));
        this.scheduleCountDownCompletion(remaining);
        this.startNetworkChecking();
      }
    }
  }
  private startNetworkChecking() {
    this.stopNetworkChecking();
    this.networkCheckInterval = setInterval(() => {
      const state = store.getState().offline;
      if (state.isCountDownActive) {
        const elapsed = Date.now() - (state.countDownStartTime || 0);
        const remaining = COUNTDOWN_DURATION - elapsed;
        logEvent('countdown_check', {
          elapsed,
          remaining: Math.max(0, remaining),
        });
      }
    }, NETWORK_CHECK_INTERVAL);
  }

  async handleInternetLost() {
    const state = store.getState().offline;
    if (state.isOfflineMode || state.isCountDownActive) {
      return;
    }
    const startTime = Date.now();

    storage.set(STORAGE_KEYS.COUNTDOWN_START, startTime);
    store.dispatch(startCountDown(startTime));
    store.dispatch(setLastKnownConnection(false));
    logEvent('internet_lost', {
      timestamp: startTime,
      countdownDuration: COUNTDOWN_DURATION,
    });
    this.scheduleCountDownCompletion(COUNTDOWN_DURATION);
    this.startNetworkChecking();
  }
  async handleInternetRestored() {
    const state = store.getState().offline;
    logEvent('internet_restore', {
      wasInCoundown: state.isCountDownActive,
      wasOffline: state.isOfflineMode,
    });
    if (state.isCountDownActive) {
      this.cancelCountdownTimer();
      storage.remove(STORAGE_KEYS.COUNTDOWN_START);
      store.dispatch(cancelCountDown());
      store.dispatch(setLastKnownConnection(true));
      logEvent('countdown_cancelled', {
        reason: 'internet_restored',
      });
    }
    if (state.isOfflineMode) {
      await SyncService.syncAndReturnToOnline();
    }
  }
  private scheduleCountDownCompletion(duration: number) {
    this.cancelCountdownTimer();

    this.countdownTimer = setTimeout(async () => {
      logEvent('countdown_completed', { duration });
      await this.triggerOfflineMode();
    }, duration);
  }
  private async triggerOfflineMode() {
    this.cancelCountdownTimer();
    this.stopNetworkChecking();
    storage.remove(STORAGE_KEYS.COUNTDOWN_START);
    store.dispatch(enterOfflineMode());
    logEvent('offline_mode_triggered', {
      timestamp: Date.now(),
    });
  }
  private cancelCountdownTimer() {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
  private stopNetworkChecking() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  }
  cleanup() {
    this.cancelCountdownTimer();
    this.stopNetworkChecking();
  }
}
export default new OfflineFallbackService();

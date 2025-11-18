import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '../store';
import { setLastKnownConnection } from '../store/slices/offlineSlice';
import OfflineFallbackService from './OfflineFallbackService';
import { logEvent } from '../logger';

const DEBOUNCE_DELAY = 500;

class NetworkService {
  private unsubscribe: (() => void) | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastState: boolean | null = null;

  async initialize() {
    const state = await NetInfo.fetch();
    await this.handleStateChange(state);

    this.unsubscribe = NetInfo.addEventListener(this.handleStateChange);
  }
  private handleStateChange = async (state: NetInfoState) => {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(async () => {
      const hasInternet = await this.verifyInternetAccess(state);
      if (hasInternet !== this.lastState) {
        this.lastState = hasInternet;

        logEvent('network_state_change', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          hasInternet,
        });
        store.dispatch(setLastKnownConnection(hasInternet));
        if (hasInternet) {
          await OfflineFallbackService.handleInternetRestored();
        } else {
          await OfflineFallbackService.handleInternetLost();
        }
      }
    }, DEBOUNCE_DELAY);
  };
  private async verifyInternetAccess(state: NetInfoState): Promise<boolean> {
    if (!state.isConnected) {
      return false;
    }
    return true;
  }
  async checkInternetNow(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return this.verifyInternetAccess(state);
  }
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
export default new NetworkService();

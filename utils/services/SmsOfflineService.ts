import {
  NativeModule,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from 'react-native';
import { store } from '../store';
import {
  enterOfflineMode,
  exitOfflineMode,
} from '../store/slices/offlineSlice';
import { logEvent } from '../logger';
import NativeSmsOfflineModule from '../../specs/NativeSmsOfflineModule';

const SmsOfflineModule =
  NativeSmsOfflineModule || NativeModules.SmsOfflineModule;
const eventEmitter = new NativeEventEmitter(SmsOfflineModule);

class SmsOfflineService {
  private eventListener: any = null;
  async initialize() {
    const hasPermissions = await this.ensurePermissions();
    if (!hasPermissions) {
      logEvent('sms_permissions_denied');
      console.warn('SMS permissions not granted');
      return;
    }
    await this.checkPendingAction();
    this.startListening();
    logEvent('sms_offline_service_initialized');
  }

  async checkPendingAction() {
    try {
      const pendingAction =
        await SmsOfflineModule.checkPendingSmsAction.checkPendingSmsAction();

      if (pendingAction) {
        logEvent('sms_pending_action_found', {
          action: pendingAction.action,
          otp: pendingAction.otp,
          timestamp: pendingAction.timestamp,
        });
      }
      await this.handleSmsAction(pendingAction.action, pendingAction.otp);
    } catch (error) {
      console.error('Error checking pending SMS action', error);
    }
  }

  private async handleSmsAction(action: 'offline' | 'online', otp: string) {
    logEvent('sms_action_processing', { action, otp });
    if (action === 'offline') {
      store.dispatch(enterOfflineMode());
      logEvent('offline_mode_enabled_via_sms', { otp });
    } else if (action === 'online') {
      store.dispatch(exitOfflineMode());
      logEvent('online_mode_enabled_via_sms', { otp });
    }
  }
  startListening() {
    this.eventListener = eventEmitter.addListener(
      'onSmsOfflineAction',
      async event => {
        logEvent('sms_action_recieved_foreground', {
          action: event.action,
          otp: event.otp,
          timestamp: event.timestamp,
        });
        await this.handleSmsAction(event.action, event.otp);
      },
    );
  }

  async ensurePermissions(): Promise<boolean> {
    try {
      const permissions = await SmsOfflineModule.checkPermissions();
      if (permissions.allGranted) return true;
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        ]);

        return (
          granted['android.permission.READ_SMS'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.RECEIVE_SMS'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking sms permissions', error);
      return false;
    }
  }

  async getConfiguration() {
    try {
      return await SmsOfflineModule.getSenderConfiguration();
    } catch (error) {
      console.error('Error getting SMS configuration', error);
      return null;
    }
  }
  cleanup() {
    if (this.eventListener) {
      this.eventListener.remove();
      this.eventListener = null;
    }
  }
}
export default new SmsOfflineService();

import { TurboModuleRegistry, TurboModule } from 'react-native';

export interface SmsPermissions {
  hasReadSms: boolean;
  hasRecievedSms: boolean;
  allGranted: boolean;
}
export interface PendingSmsAction {
  action: 'offline' | 'online';
  otp: string;
  timestamp: number;
}
export interface SmsConfig {
  authorizedSender: string;
  offlinePattern: string;
  onlinePattern: string;
}
export interface Spec extends TurboModule {
  checkPermissions(): Promise<SmsPermissions>;
  checkPendingSmsAction(): Promise<PendingSmsAction | null>;
  clearPendingAction(): Promise<boolean>;
  getSenderConfiguration(): Promise<SmsConfig>;
  addListener(eventName: string): void;
  removeListener(count: number): void;
}
export default TurboModuleRegistry.get<Spec>('SmsOfflineModule') as Spec | null;

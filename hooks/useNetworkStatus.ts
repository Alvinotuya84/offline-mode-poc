import { useSelector } from 'react-redux';
import { RootState } from '../utils/store';
export function useNetworkStatus() {
  const lastKnownConnection = useSelector(
    (state: RootState) => state.offline.lastKnownConnection,
  );
  return {
    isConnected: lastKnownConnection,
    isDisconnected: !lastKnownConnection,
  };
}

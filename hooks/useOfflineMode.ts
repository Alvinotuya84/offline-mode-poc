import { useSelector } from 'react-redux';
import { RootState } from '../utils/store';
import { COUNTDOWN_DURATION } from '../utils/constants';
export function useOfflineMode() {
  const {
    isOfflineMode,
    isCountDownActive,
    countDownStartTime,
    syncInProgress,
    syncError,
    pendingSyncItems,
  } = useSelector((state: RootState) => state.offline);

  const getRemainingTime = (): number => {
    if (!isCountDownActive || !countDownStartTime) return 0;
    const elapsed = Date.now() - countDownStartTime;
    const remaining = COUNTDOWN_DURATION - elapsed;
    return Math.max(0, remaining);
  };
  return {
    isOfflineMode,
    isCountDownActive,
    syncInProgress,
    syncError,
    pendingSyncItems,
    getRemainingTime,
  };
}

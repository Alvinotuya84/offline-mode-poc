import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOfflineMode } from './hooks/useOfflineMode';

export function OfflineIndicator() {
  const { isOfflineMode, isCountDownActive, getRemainingTime } =
    useOfflineMode();
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isCountDownActive) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingSeconds(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountDownActive, getRemainingTime]);

  if (!isOfflineMode && !isCountDownActive) return null;

  return (
    <View style={styles.container}>
      {isOfflineMode ? (
        <Text style={styles.text}>📵 Offline Mode</Text>
      ) : (
        <Text style={styles.text}>
          ⏱️ No connection - switching to offline in {remainingSeconds}s
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff9800',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

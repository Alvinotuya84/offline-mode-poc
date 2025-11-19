import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useOfflineMode } from './hooks/useOfflineMode';

export function OfflineIndicator() {
  const { isOfflineMode, isCountDownActive, getRemainingTime } =
    useOfflineMode();
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isCountDownActive) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      //console.log('remaining time', remaining / 1000);
      setRemainingSeconds(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountDownActive, getRemainingTime]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}> Offline Mode</Text>
      <Switch value={isOfflineMode} />
      {isCountDownActive && (
        <Text style={styles.text}>
          No connection - switching to offline in {remainingSeconds}s
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

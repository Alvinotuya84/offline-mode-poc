/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import '@react-native/new-app-screen';
import {
  AppState,
  AppStateStatus,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './utils/store';
import OfflineFallbackService from './utils/services/OfflineFallbackService';
import NetworkService from './utils/services/NetworkService';
import { useEffect } from 'react';
import { OfflineIndicator } from './OfflineIndicator';
import SmsOfflineService from './utils/services/SmsOfflineService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const initServices = async () => {
      await OfflineFallbackService.initialize();
      await NetworkService.initialize();
      await SmsOfflineService.initialize();
    };

    initServices();

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
      NetworkService.cleanup();
      OfflineFallbackService.cleanup();
      SmsOfflineService.cleanup();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await SmsOfflineService.checkPendingAction();
      const hasInternet = await NetworkService.checkInternetNow();
      console.log('App resumed, internet:', hasInternet);
    }
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <OfflineIndicator />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

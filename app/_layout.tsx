import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { Colors } from '@/utils/colors';

function RootStack() {
  const { settings } = useGame();
  const dark = settings.theme === 'dark';
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="game" />
        <Stack.Screen name="create" />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Réglages',
            headerShown: true,
            animation: 'slide_from_right',
            headerStyle: {
              backgroundColor: dark ? Colors.backgroundDark : Colors.background,
            },
            headerTintColor: dark ? Colors.textPrimaryDark : Colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '800',
            },
          }}
        />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <RootStack />
      </GameProvider>
    </SafeAreaProvider>
  );
}

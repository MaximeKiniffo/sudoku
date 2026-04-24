import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameProvider, useGame } from '@/contexts/GameContext';

function RootStack() {
  const { settings } = useGame();
  const dark = settings.theme === 'dark';
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="game" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GameProvider>
      <RootStack />
    </GameProvider>
  );
}

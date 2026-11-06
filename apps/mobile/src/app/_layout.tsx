import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Dock } from "@/components/Dock";
import { onNotificationTap } from "@/features/notifications/push";
import { ApiError } from "@/lib/api";
import { openSitePath } from "@/lib/links";
import { colors, fonts } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

void SplashScreen.preventAutoHideAsync();

/** Screens open without an account: the onboarding and signing in. */
const PUBLIC_SCREENS = ["welcome", "login"];

/**
 * The app needs an account. Until the stored session has been tried the
 * splash stays up; then anyone signed out is sent to the onboarding, and
 * anyone signed in is taken past it — including straight after verifying a
 * code, and straight back out after logging out.
 */
function AuthGate() {
  const { user, isRestoring } = useAuth();
  const segments = useSegments();
  const onPublic = PUBLIC_SCREENS.includes(segments[0] ?? "");

  useEffect(() => {
    if (isRestoring) return;
    if (!user && !onPublic) router.replace("/welcome");
    else if (user && onPublic) router.replace("/");
    void SplashScreen.hideAsync();
  }, [user, isRestoring, onPublic]);

  return null;
}

/** Tapping a notification opens what it's about. */
function NotificationRouter() {
  useEffect(
    () => onNotificationTap((href) => openSitePath(href, router.push)),
    [],
  );
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // A 4xx is an answer (not found, not yours), not a blip.
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  );

  // Nothing draws until the fonts are in — Android keeps text in the fallback
  // font if it was laid out first. The splash stays up meanwhile, and a font
  // that fails to load falls back to the system's rather than holding the
  // app shut.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate />
          <NotificationRouter />
          <StatusBar style="light" />
          <View style={{ flex: 1, backgroundColor: colors.canvas }}>
            <Stack
              screenOptions={{
                headerTintColor: colors.ink,
                headerTitleStyle: {
                  fontFamily: fonts.bold,
                  fontSize: 17,
                  color: colors.ink,
                },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.canvas },
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="welcome"
                options={{ headerShown: false, animation: "fade" }}
              />
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack>
            <Dock />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

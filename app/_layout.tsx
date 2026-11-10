import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/query/queryClient';
import { AppProvider, useApp } from '../src/state/AppContext';
import { IncomingJobRequestModal } from '../src/components/IncomingJobRequestModal';
import { resolveBookingUuid } from '../src/utils/uuid';
import { Job } from '../src/types';

// Ensure background GPS TaskManager task is registered at module scope
import '../src/services/TrackingLifecycleManager';
import '../global.css';

function RootLayoutContent() {
  const router = useRouter();
  const { jobRequests, acceptJob, rejectJob } = useApp();

  // Show modal for the most recent incoming request
  const currentLead = jobRequests.length > 0 ? jobRequests[0] : null;

  const handleAccept = (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    acceptJob(bookingId);
    router.push({
      pathname: '/jobs/active',
      params: { bookingId, jobId: job.jobId },
    });
  };

  const handleReject = (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    rejectJob(bookingId);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="jobs/active" />
        <Stack.Screen name="jobs/requests" />
        <Stack.Screen name="jobs/[id]" />
        <Stack.Screen name="jobs/completion" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="navigation-tracking" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="bank-details" />
        <Stack.Screen name="support" />
        <Stack.Screen name="settings" />
      </Stack>

      <IncomingJobRequestModal
        visible={Boolean(currentLead)}
        job={currentLead}
        onAccept={handleAccept}
        onReject={handleReject}
        countdownSeconds={30}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppProvider>
            <RootLayoutContent />
          </AppProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
});

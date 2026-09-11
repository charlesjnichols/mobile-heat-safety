import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { PALETTE } from '../../utils/outdoorColors';
import { logout, isHostedUiConfigured } from '../../auth/hostedAuth';

interface SettingsViewProps {
  onSignOut: () => void;
}

const SettingsView = ({ onSignOut }: SettingsViewProps) => {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      onSignOut();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={PALETTE.TEXT_SECONDARY} />
            <Text style={styles.infoText}>Mobile Heat Safety Tracker</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="code-slash" size={20} color={PALETTE.TEXT_SECONDARY} />
            <Text style={styles.infoText}>Version {version}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={PALETTE.GREEN_500} />
            <Text style={styles.featureText}>Real-time heat index calculations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={PALETTE.GREEN_500} />
            <Text style={styles.featureText}>Team practice tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={PALETTE.GREEN_500} />
            <Text style={styles.featureText}>High-contrast outdoor interface</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={PALETTE.GREEN_500} />
            <Text style={styles.featureText}>Haptic feedback support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data &amp; Privacy</Text>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color={PALETTE.TEXT_SECONDARY} />
            <Text style={styles.infoText}>Data stored locally on device</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cloud-offline" size={20} color={PALETTE.TEXT_SECONDARY} />
            <Text style={styles.infoText}>No internet connection required</Text>
          </View>
        </View>

        {isHostedUiConfigured() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <Ionicons name="log-out-outline" size={20} color={PALETTE.WHITE} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  featureText: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 16,
    marginLeft: 12,
  },
  header: {
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    padding: 16,
  },
  headerTitle: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoText: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 16,
    marginLeft: 12,
  },
  safeArea: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  section: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: PALETTE.RED_BOOTSTRAP,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsView;
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsView = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.infoText}>Mobile Heat Safety Tracker</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="code-slash" size={20} color="#6b7280" />
            <Text style={styles.infoText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.featureText}>Real-time heat index calculations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.featureText}>Team practice tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.featureText}>High-contrast outdoor interface</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.featureText}>Haptic feedback support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
            <Text style={styles.infoText}>Data stored locally on device</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cloud-offline" size={20} color="#6b7280" />
            <Text style={styles.infoText}>No internet connection required</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  container: {
    backgroundColor: '#f8fafc',
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
    color: '#374151',
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    padding: 16,
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoText: {
    color: '#374151',
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default SettingsView;
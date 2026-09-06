import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';

// Import views
import MainView from '../views/MainView';
import TeamView from '../views/TeamView';
import HeatStressGuideView from '../views/HeatStressGuideView';
import PracticeDetailView from '../views/PracticeDetailView';
import SettingsView from '../views/SettingsView';
import PracticeForm from '../forms/PracticeForm';
import ChecklistForm from '../forms/ChecklistForm';

// Tab Navigator
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Main') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Teams') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Safety') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Main" 
        component={MainView}
        options={{
          tabBarLabel: 'Practices',
        }}
      />
      <Tab.Screen 
        name="Teams" 
        component={TeamView}
        options={{
          tabBarLabel: 'Teams',
        }}
      />
      <Tab.Screen 
        name="Safety" 
        component={HeatStressGuideView}
        options={{
          tabBarLabel: 'Safety',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsView}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PracticeDetail" 
          component={PracticeDetailView}
          options={{ 
            title: 'Practice Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="PracticeForm" 
          component={PracticeForm}
          options={{ 
            title: 'Practice',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="ChecklistForm" 
          component={ChecklistForm}
          options={{ 
            title: 'Checklist Entry',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
      
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};

export default AppNavigator;
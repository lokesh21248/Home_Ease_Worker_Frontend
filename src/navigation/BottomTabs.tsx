import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from './types';
import { colors } from '../theme/colors';
import { HomeDashboardScreen } from '../screens/dashboard/HomeDashboardScreen';
import { SlotsScreen } from '../screens/slots/SlotsScreen';
import { JobsTabScreen } from '../screens/jobs/JobsTabScreen';
import { EarningsScreen } from '../screens/earnings/EarningsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useApp } from '../state/AppContext';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabs: React.FC = () => {
  const { jobRequests } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SlotsTab"
        component={SlotsScreen}
        options={{
          tabBarLabel: 'Slots',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="JobsTab"
        component={JobsTabScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarBadge: jobRequests.length > 0 ? jobRequests.length : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'briefcase' : 'briefcase-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 66,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    paddingTop: 8,
    shadowColor: '#173B8F',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
  },
});

export default BottomTabs;

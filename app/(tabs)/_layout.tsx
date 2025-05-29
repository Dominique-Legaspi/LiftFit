import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Fonts } from '@/constants/Fonts';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = Colors.light.blue;
  const inactiveColor = Colors.light.gray;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].blue,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].gray,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: Colors.light.gray,
          elevation: 0, // hide shadow for android
          shadowOpacity: 0, // hide shadow for ios
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.regular,
          fontSize: Platform.OS === 'web' ? 20 : 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name='home-outline'
                size={Platform.OS === 'web' ? 20 : 24}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name='search-outline'
                size={Platform.OS === 'web' ? 20 : 24}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
          tabBarLabel: 'Browse',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name='cart-outline'
                size={Platform.OS === 'web' ? 20 : 24}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
          tabBarLabel: 'Cart',
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name='heart-outline'
                size={Platform.OS === 'web' ? 20 : 24}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
          tabBarLabel: 'Wishlist',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name='person-outline'
                size={Platform.OS === 'web' ? 20 : 24}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

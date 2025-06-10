import { useUser } from '@/app/context/UserProvider';
import { supabase } from '@/app/lib/supabase';
import SectionHeader from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ComponentProps, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

type UserProps = {
  id: string;
  created_at: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
};

interface AccountListItem {
  id: number;
  icon?: ComponentProps<typeof Ionicons>['name'];
  name: string;
  desc?: string;
  style?: StyleProp<ViewStyle>;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const [userData, setUserData] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchProfile() {
    if (!userId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile data:", error);
        return;
      }

      setUserData(data);

    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleSignOut = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // route back to login screen
      router.replace('/auth/login');
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  }

  const confirmSignOut = () => {
  Alert.alert(
    'Confirm Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
    ],
    { cancelable: true }
  )
}

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.blue} />
      </SafeAreaView>
    )
  };

  const ListComponent = ({ icon, name, desc, style }: AccountListItem) => {
    return (
      <View style={[styles.listCard, style]}>
        <View style={styles.listTitleIconContainer}>
          <Ionicons name={icon} size={28} color={Colors.light.blue} />
          <View style={styles.listTitleContainer}>
            <Text style={styles.listTitle}>{name}</Text>
            <Text style={styles.listText}>{desc}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={28} color={Colors.light.blue + '77'} />
      </View>
    )
  }

  const myProfileList: AccountListItem[] = [
    { id: 1, icon: 'cart-outline', name: 'Orders', desc: 'View and manage your orders' },
    { id: 2, icon: 'star-outline', name: 'Rewards', desc: 'Check your reward points' },
    { id: 3, icon: 'chatbubble-outline', name: 'Reviews', desc: 'View and manage your reviews' },
  ];

  const myAccountList: AccountListItem[] = [
    { id: 11, icon: 'notifications-outline', name: 'Notifications', desc: 'Get notified with new deals and updates' },
    { id: 12, icon: 'card-outline', name: 'Payment Methods', desc: 'Update your payment method for faster checkout' },
    { id: 13, icon: 'settings-outline', name: 'Account Settings', desc: 'Update your personal info, phone number, and more' },
  ];

  const supportList: AccountListItem[] = [
    { id: 21, icon: 'chatbubbles-outline', name: 'Contact Support', desc: 'Need help? Chat with customer support' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollViewContainer}
        contentContainerStyle={{ paddingBottom: 80 }}>
        {/* settings */}
        {/* <Pressable
          onPress={() => router.push('/profile/settings')}
          style={styles.settingsContainer}
        >
          <Ionicons name="settings-outline" size={28} style={styles.settingsIcon} />
        </Pressable> */}

        {/* user info */}
        <View style={styles.userInfoContainer}>
          <View>
            <Text style={styles.userUsername}>
              {userData?.username ?? "User"}
            </Text>

            {(userData?.first_name || userData?.last_name) && (
              <Text style={styles.userInfoText}>
                {userData?.first_name ?? ''} {userData?.last_name ?? ''}
              </Text>
            )}

            <Text style={styles.userInfoText}>
              Member since {new Date(userData?.created_at ?? '')
                .toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          {userData?.avatar_url && (
            <Image
              source={{ uri: userData.avatar_url }}
              style={styles.userAvatar}
              resizeMode='contain'
            />
          )}
        </View>

        {/* my profile */}
        <SectionHeader title="My Profile" />
        {myProfileList.map((cat, index) => {
          const isLast = index === myProfileList.length - 1;

          return (
            <ListComponent
              key={cat.id}
              id={cat.id}
              icon={cat.icon}
              name={cat.name}
              desc={cat.desc}
              style={isLast ? { borderBottomWidth: 0 } : undefined}
            />
          )
        })}

        {/* my account */}
        <SectionHeader title="My Account" />
        {myAccountList.map((cat, index) => {
          const isLast = index === myAccountList.length - 1;

          return (
            <ListComponent
              key={cat.id}
              id={cat.id}
              icon={cat.icon}
              name={cat.name}
              desc={cat.desc}
              style={isLast ? { borderBottomWidth: 0 } : undefined}
            />
          )
        })}

        {/* support */}
        <SectionHeader title="Support" />
        {supportList.map((cat, index) => {
          const isLast = index === supportList.length - 1;

          return (
            <ListComponent
              key={cat.id}
              id={cat.id}
              icon={cat.icon}
              name={cat.name}
              desc={cat.desc}
              style={isLast ? { borderBottomWidth: 0 } : undefined}
            />
          )
        })}

        {/* sign out */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={confirmSignOut}
            style={styles.buttonBox}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : (
                <Text style={styles.buttonText}>
                  Sign Out
                </Text>
              )
            }
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  // settings
  settingsContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  settingsIcon: {
    padding: 8,
    color: Colors.light.blue,
  },

  // user info
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray + '33',
  },

  // avatar
  userAvatar: {
    marginLeft: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  // username
  userUsername: {
    fontFamily: Fonts.semiBold,
    fontSize: 32,
    color: Colors.light.blue,
  },
  userInfoText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.light.gray,
  },

  // account list
  listCard: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray + '33',
    padding: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitleContainer: {
    marginLeft: 10,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.light.darkblue,
  },
  listText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.light.darkgray,
  },

  // button
  buttonContainer: {
    width: '100%',
    marginTop: 50,
  },
  buttonBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.blue,
    borderRadius: 3,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: Colors.light.blue,
  },
});

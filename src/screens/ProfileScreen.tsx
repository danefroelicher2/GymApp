// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { followService } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfileScreen() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowCounts();
    }
  }, [user]);

  const fetchFollowCounts = async () => {
    if (!user) return;

    try {
      const [followersResult, followingResult] = await Promise.all([
        followService.getFollowersCount(user.id),
        followService.getFollowingCount(user.id),
      ]);

      if (followersResult.error) {
        console.error('Error fetching followers count:', followersResult.error);
      } else {
        setFollowersCount(followersResult.count);
      }

      if (followingResult.error) {
        console.error('Error fetching following count:', followingResult.error);
      } else {
        setFollowingCount(followingResult.count);
      }
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing feature coming soon!\n\nFor now, you can update your profile directly in your Supabase dashboard.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(profile?.full_name || profile?.username || user?.email || 'U')
                    .charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {profile?.full_name || profile?.username || 'Anonymous User'}
          </Text>

          {profile?.username && (
            <Text style={styles.username}>@{profile.username}</Text>
          )}

          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={18} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Fitness Info */}
        {(profile?.fitness_goal || profile?.height_cm || profile?.weight_kg) && (
          <View style={styles.fitnessSection}>
            <Text style={styles.sectionTitle}>Fitness Info</Text>
            
            {profile.fitness_goal && (
              <View style={styles.fitnessItem}>
                <Ionicons name="target-outline" size={20} color="#666" />
                <Text style={styles.fitnessText}>Goal: {profile.fitness_goal}</Text>
              </View>
            )}

            {profile.height_cm && (
              <View style={styles.fitnessItem}>
                <Ionicons name="resize-outline" size={20} color="#666" />
                <Text style={styles.fitnessText}>Height: {profile.height_cm} cm</Text>
              </View>
            )}

            {profile.weight_kg && (
              <View style={styles.fitnessItem}>
                <Ionicons name="scale-outline" size={20} color="#666" />
                <Text style={styles.fitnessText}>Weight: {profile.weight_kg} kg</Text>
              </View>
            )}
          </View>
        )}

        {/* Account Info */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.accountText}>{user?.email}</Text>
          </View>
          {profile?.created_at && (
            <View style={styles.accountItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.accountText}>
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 12,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fitnessSection: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  accountSection: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fitnessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fitnessText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
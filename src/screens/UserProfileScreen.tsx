// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { profileService, followService, workoutService } from '../services/supabase';
import { Profile, Workout } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from '../components/FollowButton';
import WorkoutCard from '../components/WorkoutCard';
import LoadingSpinner from '../components/LoadingSpinner';

interface UserProfileScreenProps {
  route: {
    params: {
      userId: string;
      username?: string;
    };
  };
}

export default function UserProfileScreen({ route }: UserProfileScreenProps) {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch profile, follow counts, and workouts in parallel
      const [profileResult, followersResult, followingResult, workoutsResult] = await Promise.all([
        profileService.getProfile(userId),
        followService.getFollowersCount(userId),
        followService.getFollowingCount(userId),
        workoutService.getUserWorkouts(userId),
      ]);

      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
        Alert.alert('Error', 'Failed to load user profile');
        return;
      }

      setProfile(profileResult.data);
      setFollowersCount(followersResult.count);
      setFollowingCount(followingResult.count);
      setWorkouts(workoutsResult.data?.filter(w => w.is_public) || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutLike = async (workoutId: string) => {
    try {
      const { error } = await workoutService.toggleWorkoutLike(workoutId);
      if (error) {
        Alert.alert('Error', 'Failed to update like');
        return;
      }
      // Refresh workouts to show updated like count
      const { data } = await workoutService.getUserWorkouts(userId);
      setWorkouts(data?.filter(w => w.is_public) || []);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    // Update followers count when follow status changes
    setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <WorkoutCard 
      workout={item} 
      onLike={() => handleWorkoutLike(item.id)}
      showUserInfo={false}
    />
  );

  const renderEmptyWorkouts = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>No public workouts yet</Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {profile.full_name || profile.username || 'Anonymous User'}
        </Text>

        {profile.username && (
          <Text style={styles.username}>@{profile.username}</Text>
        )}

        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Follow Button (only show if not current user) */}
        {user && user.id !== userId && (
          <View style={styles.followButtonContainer}>
            <FollowButton 
              targetUserId={userId} 
              onFollowChange={handleFollowChange}
            />
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{workouts.length}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
        </View>
      </View>

      {/* Workouts Section */}
      <View style={styles.workoutsSection}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {workouts.length > 0 ? (
          <FlatList
            data={workouts}
            renderItem={renderWorkout}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        ) : (
          renderEmptyWorkouts()
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
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
  followButtonContainer: {
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  workoutsSection: {
    marginTop: 12,
    backgroundColor: 'white',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});
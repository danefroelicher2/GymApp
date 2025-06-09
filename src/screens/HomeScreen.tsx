// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { workoutService } from '../services/supabase';
import { Workout } from '../types/database';
import WorkoutCard from '../components/WorkoutCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkouts = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const { data, error } = await workoutService.getPublicWorkouts(20);
      
      if (error) {
        console.error('Error fetching workouts:', error);
        Alert.alert('Error', 'Failed to load workouts');
        return;
      }

      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkouts(true);
  }, []);

  const handleWorkoutLike = async (workoutId: string) => {
    try {
      const { error } = await workoutService.toggleWorkoutLike(workoutId);
      if (error) {
        Alert.alert('Error', 'Failed to update like');
        return;
      }

      // Refresh the list to show updated like count
      await fetchWorkouts(true);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  // Fetch workouts when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const renderWorkout = ({ item }: { item: Workout }) => (
    <WorkoutCard 
      workout={item} 
      onLike={() => handleWorkoutLike(item.id)}
      showUserInfo={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏋️</Text>
      <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyStateText}>
        Be the first to share a workout! {'\n'}
        Go to "My Workouts" to add your first workout.
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
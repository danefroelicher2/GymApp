// src/screens/WorkoutsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { workoutService } from "../services/supabase";
import { Workout } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import WorkoutCard from "../components/WorkoutCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchUserWorkouts = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (!isRefresh) setLoading(true);

      const { data, error } = await workoutService.getUserWorkouts(user.id);

      if (error) {
        console.error("Error fetching user workouts:", error);
        Alert.alert("Error", "Failed to load workouts");
        return;
      }

      setWorkouts((data || []) as unknown as Workout[]);
    } catch (error) {
      console.error("Error fetching user workouts:", error);
      Alert.alert("Error", "Failed to load workouts");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserWorkouts(true);
  }, [user]);

  const handleWorkoutLike = async (workoutId: string) => {
    try {
      const { error } = await workoutService.toggleWorkoutLike(workoutId);
      if (error) {
        Alert.alert("Error", "Failed to update like");
        return;
      }
      await fetchUserWorkouts(true);
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update like");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserWorkouts();
    }, [user])
  );

  const handleAddWorkout = () => {
    Alert.alert(
      "Add Workout",
      "Workout creation feature coming soon!\n\nFor now, you can add workouts directly in your Supabase dashboard.",
      [{ text: "OK" }]
    );
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <WorkoutCard
      workout={item}
      onLike={() => handleWorkoutLike(item.id)}
      showUserInfo={false}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏋️</Text>
      <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyStateText}>
        Start tracking your fitness journey!{"\n"}
        Add your first workout to get started.
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddWorkout}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Workout</Text>
      </TouchableOpacity>
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

      {workouts.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleAddWorkout}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

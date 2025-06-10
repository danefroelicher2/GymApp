// src/services/supabase.ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Database } from "../types/database";

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter using SecureStore for sensitive data
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for common operations
export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getCurrentSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },
};

// Profile service
export const profileService = {
  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  // Check if username is available
  checkUsernameAvailable: async (username: string, currentUserId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .neq("id", currentUserId)
      .limit(1);

    if (error) return { available: false, error };
    return { available: data.length === 0, error: null };
  },

  // Search users
  searchUsers: async (searchTerm: string, limit = 10) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(limit);
    return { data, error };
  },
};

// Follow service
export const followService = {
  // Follow a user
  followUser: async (followingId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: followingId,
    });
    return { data, error };
  },

  // Unfollow a user
  unfollowUser: async (followingId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);
    return { error };
  },

  // Check if following a user
  isFollowing: async (followingId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isFollowing: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single();

    return {
      isFollowing: !!data,
      error: error?.code === "PGRST116" ? null : error,
    };
  },

  // Get followers count
  getFollowersCount: async (userId: string) => {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);
    return { count: count || 0, error };
  },

  // Get following count
  getFollowingCount: async (userId: string) => {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);
    return { count: count || 0, error };
  },

  // Get following users
  getFollowing: async (userId: string) => {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        following_id,
        profiles:following_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("follower_id", userId);
    return { data, error };
  },
};

// Workout service
export const workoutService = {
  // Create workout
  createWorkout: async (
    workout: Database["public"]["Tables"]["workouts"]["Insert"]
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const workoutData: Database["public"]["Tables"]["workouts"]["Insert"] = {
      ...workout,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("workouts")
      .insert(workoutData)
      .select()
      .single();
    return { data, error };
  },

  // Get user's workouts
  getUserWorkouts: async (userId: string) => {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        ),
        exercises (*),
        workout_likes (
          user_id
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data: data as any, error };
  },

  // Get public workouts feed
  getPublicWorkouts: async (limit = 20) => {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        ),
        exercises (*),
        workout_likes (
          user_id
        )
      `
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data: data as any, error };
  },

  // Get following workouts feed
  getFollowingWorkouts: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Not authenticated" };

    // First get the list of users being followed
    const { data: following, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followingError) {
      return { data: [], error: followingError };
    }

    if (!following || following.length === 0) {
      return { data: [], error: null };
    }

    const followingIds = following.map((f) => f.following_id);

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        ),
        exercises (*),
        workout_likes (
          user_id
        )
      `
      )
      .eq("is_public", true)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false });
    return { data: data as any, error };
  },

  // Like/unlike workout
  toggleWorkoutLike: async (workoutId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("workout_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("workout_id", workoutId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from("workout_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("workout_id", workoutId);
      return { liked: false, error };
    } else {
      // Like
      const { error } = await supabase.from("workout_likes").insert({
        user_id: user.id,
        workout_id: workoutId,
      });
      return { liked: true, error };
    }
  },
};

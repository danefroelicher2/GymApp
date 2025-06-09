// src/components/WorkoutCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

interface WorkoutCardProps {
  workout: Workout;
  onLike?: () => void;
  showUserInfo?: boolean;
}

export default function WorkoutCard({ 
  workout, 
  onLike,
  showUserInfo = false 
}: WorkoutCardProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = workout.workout_likes?.some(like => like.user_id === user?.id) || false;
  const likeCount = workout.workout_likes?.length || 0;

  const handleLike = async () => {
    if (isLiking || !onLike) return;
    
    setIsLiking(true);
    await onLike();
    setIsLiking(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <View style={styles.container}>
      {/* User Info Header */}
      {showUserInfo && workout.profiles && (
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {workout.profiles.avatar_url ? (
                <Image 
                  source={{ uri: workout.profiles.avatar_url }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(workout.profiles.full_name || workout.profiles.username || 'U')
                      .charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {workout.profiles.full_name || workout.profiles.username || 'Anonymous'}
              </Text>
              <Text style={styles.workoutDate}>
                {formatDate(workout.date)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Workout Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{workout.title}</Text>
        
        {workout.description && (
          <Text style={styles.description}>{workout.description}</Text>
        )}

        {/* Workout Stats */}
        <View style={styles.stats}>
          {workout.duration_minutes && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                {formatDuration(workout.duration_minutes)}
              </Text>
            </View>
          )}
          
          {workout.calories_burned && (
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                {workout.calories_burned} cal
              </Text>
            </View>
          )}

          {workout.exercises && workout.exercises.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Exercises Preview */}
        {workout.exercises && workout.exercises.length > 0 && (
          <View style={styles.exercises}>
            <Text style={styles.exercisesTitle}>Exercises:</Text>
            {workout.exercises.slice(0, 3).map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseDetails}>
                  {exercise.sets && exercise.reps && (
                    <Text style={styles.exerciseDetail}>
                      {exercise.sets} × {exercise.reps}
                    </Text>
                  )}
                  {exercise.weight_kg && (
                    <Text style={styles.exerciseDetail}>
                      {exercise.weight_kg}kg
                    </Text>
                  )}
                  {exercise.duration_seconds && (
                    <Text style={styles.exerciseDetail}>
                      {Math.round(exercise.duration_seconds / 60)}min
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            {workout.exercises.length > 3 && (
              <Text style={styles.moreExercises}>
                +{workout.exercises.length - 3} more exercise{workout.exercises.length - 3 !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={handleLike}
          disabled={isLiking}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#FF3B30" : "#666"} 
          />
          <Text style={[
            styles.likeText,
            isLiked && styles.likedText
          ]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  exercises: {
    marginTop: 8,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: 'row',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  moreExercises: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  likedText: {
    color: '#FF3B30',
  },
});
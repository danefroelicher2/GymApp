// src/components/FollowButton.tsx
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { followService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  style?: any;
}

export default function FollowButton({ 
  targetUserId, 
  onFollowChange,
  style 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId, user]);

  const checkFollowStatus = async () => {
    if (!user || user.id === targetUserId) {
      setCheckingStatus(false);
      return;
    }

    try {
      const { isFollowing: following, error } = await followService.isFollowing(targetUserId);
      
      if (error) {
        console.error('Error checking follow status:', error);
      } else {
        setIsFollowing(following);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      let error;
      
      if (isFollowing) {
        ({ error } = await followService.unfollowUser(targetUserId));
      } else {
        ({ error } = await followService.followUser(targetUserId));
      }

      if (error) {
        Alert.alert('Error', 'Failed to update follow status');
        console.error('Follow toggle error:', error);
        return;
      }

      const newFollowingStatus = !isFollowing;
      setIsFollowing(newFollowingStatus);
      onFollowChange?.(newFollowingStatus);
      
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if checking status or if it's the user's own profile
  if (checkingStatus || !user || user.id === targetUserId) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.followingButton : styles.followButton,
        style,
      ]}
      onPress={handleToggleFollow}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isFollowing ? "#666" : "white"} 
        />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            isFollowing ? styles.followingText : styles.followText,
          ]}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#007AFF',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followText: {
    color: 'white',
  },
  followingText: {
    color: '#666',
  },
});
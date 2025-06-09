// src/components/UserCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Profile } from '../types/database';
import FollowButton from './FollowButton';

interface UserCardProps {
  user: Profile;
  onPress: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
  showFollowButton?: boolean;
}

export default function UserCard({ 
  user, 
  onPress, 
  onFollowChange,
  showFollowButton = true 
}: UserCardProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userInfo} onPress={onPress}>
        <View style={styles.avatar}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.name}>
            {user.full_name || user.username || 'Anonymous User'}
          </Text>
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {showFollowButton && (
        <FollowButton
          targetUserId={user.id}
          onFollowChange={onFollowChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#888',
    lineHeight: 18,
  },
});
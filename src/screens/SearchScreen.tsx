// src/screens/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { profileService, followService } from '../services/supabase';
import { Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import UserCard from '../components/UserCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SearchScreen({ navigation }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const { user } = useAuth();

  // Fetch suggested users on mount
  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await profileService.searchUsers(searchTerm);
      
      if (error) {
        console.error('Search error:', error);
        Alert.alert('Error', 'Failed to search users');
        return;
      }

      // Filter out current user from results
      const filteredResults = (data || []).filter(profile => profile.id !== user?.id);
      setResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setLoadingSuggestions(true);
      
      // Get all users (you might want to implement a "suggested users" logic here)
      const { data, error } = await profileService.searchUsers('', 10);
      
      if (error) {
        console.error('Error fetching suggestions:', error);
        return;
      }

      // Filter out current user and shuffle for variety
      const filteredUsers = (data || [])
        .filter(profile => profile.id !== user?.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
      
      setSuggestedUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUserPress = (userId: string, username: string) => {
    navigation.navigate('UserProfile', { userId, username });
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // If user was unfollowed, optionally refresh suggestions
    if (!isFollowing) {
      // Could refresh suggestions here
    }
  };

  const renderUser = ({ item }: { item: Profile }) => (
    <UserCard
      user={item}
      onPress={() => handleUserPress(item.id, item.username || 'User')}
      onFollowChange={(isFollowing) => handleFollowChange(item.id, isFollowing)}
    />
  );

  const renderSuggestedUser = ({ item }: { item: Profile }) => (
    <UserCard
      user={item}
      onPress={() => handleUserPress(item.id, item.username || 'User')}
      onFollowChange={(isFollowing) => handleFollowChange(item.id, isFollowing)}
      showFollowButton={true}
    />
  );

  const renderEmptySearchState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchTerm ? `No users found for "${searchTerm}"` : 'Search for users by name or username'}
      </Text>
    </View>
  );

  const renderSuggestedSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Suggested Users</Text>
      {loadingSuggestions ? (
        <LoadingSpinner />
      ) : suggestedUsers.length > 0 ? (
        <FlatList
          data={suggestedUsers}
          renderItem={renderSuggestedUser}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noSuggestionsText}>No suggestions available</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Users</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchTerm('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.content}>
        {searchTerm.trim() ? (
          // Show search results
          <>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <FlatList
                data={results}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptySearchState}
              />
            )}
          </>
        ) : (
          // Show suggested users when not searching
          renderSuggestedSection()
        )}
      </div>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  section: {
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
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
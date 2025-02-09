import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GalleryPost } from '../constants/mockGalleryData';

interface GalleryFeedProps {
  posts: GalleryPost[];
}

export const GalleryFeed = ({ posts }: GalleryFeedProps) => {
  return (
    <ScrollView style={styles.container}>
      {posts.map((post) => (
        <View key={post.id} style={styles.postContainer}>
          <View style={styles.postHeader}>
            <Image source={post.userAvatar} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{post.userName}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {post.rating}</Text>
            </View>
          </View>
          
          <Image source={post.image} style={styles.postImage} />
          
          <View style={styles.postFooter}>
            <Text style={styles.caption}>{post.caption}</Text>
            <View style={styles.interactions}>
              <TouchableOpacity style={styles.interactionButton}>
                <Text>❤️ {post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionButton}>
                <Text>💬 {post.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  ratingContainer: {
    marginLeft: 'auto',
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  postFooter: {
    padding: 10,
  },
  caption: {
    fontSize: 14,
    marginBottom: 10,
  },
  interactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionButton: {
    padding: 5,
  },
}); 
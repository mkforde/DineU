import React, { useState } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, Text, Image, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { diningLocations, COLUMBIA_CENTER } from '../constants/diningLocation';
import { GalleryFeed } from '../components/GalleryFeed';
import { getDiningHallPosts } from '../constants/mockGalleryData';

export default function App() {
  const [selectedDining, setSelectedDining] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  const handleMarkerPress = (location) => {
    setSelectedDining(location);
    setShowGallery(true);
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={COLUMBIA_CENTER}
      >
        {diningLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinates}
            title={location.name}
            onPress={() => handleMarkerPress(location)}
          >
            <Image 
              source={location.icon}
              style={styles.markerImage}
            />
            <Callout>
              <Text>{location.name}</Text>
              <Text>Tap to see posts</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Modal
        animationType="slide"
        visible={showGallery}
        onRequestClose={() => setShowGallery(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedDining?.name}</Text>
            <TouchableOpacity 
              onPress={() => setShowGallery(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedDining && (
            <GalleryFeed 
              posts={getDiningHallPosts(selectedDining.name)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  }
});

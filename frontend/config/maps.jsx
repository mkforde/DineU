import React from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, Text, Image } from 'react-native';
import { diningLocations, COLUMBIA_CENTER } from '../constants/diningLocation';

export default function App() {
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
          >
            <Image 
              source={location.icon}
              style={styles.markerImage}
            />
            <Callout>
              <Text>{location.name}</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>
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
    width: 50,  // Much larger marker size
    height: 50, // Much larger marker size
    resizeMode: 'contain'
  }
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API from '../config/api';

const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (!user || !user.token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(API.uploads, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.data.success) {
        setHistory(response.data.uploads || []);
      } else {
        Alert.alert('Server Error', response.data.error || 'Failed to fetch upload history.');
      }
    } catch (error) {
      if (error.response) {
        Alert.alert('Server Error', `Status: ${error.response.status}\nMessage: ${error.response.data?.error || 'Error occurred'}`);
      } else {
        Alert.alert('Network Error', 'Unable to connect to the server.');
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No upload history available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {history.map((item) => (
        <View key={item._id} style={styles.card}>
          <Text style={styles.title}>{item.formName || 'No Form Name'}</Text>
          <Text style={styles.subtitle}>Status: {item.status || 'Unknown'}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          {item.imageUrls.length > 0 && (
            <Text style={styles.imageCount}>Images: {item.imageCount}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  imageCount: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});

export default HistoryScreen;
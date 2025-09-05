import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

// Mock react-native-push-notification to avoid setup issues in tests
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
  });
});
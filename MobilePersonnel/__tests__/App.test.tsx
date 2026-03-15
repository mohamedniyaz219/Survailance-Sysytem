/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/stack', () => {
  const MockNavigator = ({ children }: { children: React.ReactNode }) => children;
  const MockScreen = () => null;
  return {
    createStackNavigator: () => ({
      Navigator: MockNavigator,
      Screen: MockScreen,
    }),
  };
});

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');

  const MockMap = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );

  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap,
    Polyline: MockMap,
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

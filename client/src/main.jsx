import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // or your tailwind css file

// 1. Import Provider and your Store
import { Provider } from 'react-redux';
import { store } from './redux/store';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap App with Provider */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store, persistedStore } from './store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

//<PersistGate loading={null} persistor={persistedStore}></PersistGate>
// If you want to start measuring performance in your app, pass a function  <PersistGate loading={null} persistor={persistStore(store)}>  </PersistGate>
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistedStore}>
      <React.StrictMode>
        <App />
      </React.StrictMode>{' '}
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);
reportWebVitals();

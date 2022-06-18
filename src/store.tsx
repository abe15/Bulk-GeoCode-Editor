import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import geocodesReducer1 from './geocodes';
import localforage from 'localforage';
import persistReducer from 'redux-persist/es/persistReducer';
import { combineReducers } from 'redux';
const persistConfig = {
  key: 'root',
  storage: localforage,
};
const geocodesReducer = persistReducer(persistConfig, geocodesReducer1);

export const store = configureStore({
  reducer: { geocodesReducer },
});

export const persistedStore = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

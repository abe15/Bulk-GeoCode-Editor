import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import geocodesReducer from './geocodes';

//const persistedReducer = persistReducer(persistConfig, geocodesReducer);
export const store = configureStore({
  reducer: { geocodesReducer },
});
export const persistedStore = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

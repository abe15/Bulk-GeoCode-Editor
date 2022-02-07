import { configureStore } from '@reduxjs/toolkit';
import geocodesReducer from './geocodes';

//const persistedReducer = persistReducer(persistConfig, geocodesReducer);
const store = configureStore({
  reducer: { geocodesReducer },
});
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export default store;

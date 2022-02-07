import { Action, createSlice, Reducer } from '@reduxjs/toolkit';
import { current } from '@reduxjs/toolkit';

export const undoable = function undoable(reducer: Reducer<any, Action>) {
  // Call the reducer with empty action to populate the initial state
  const initialState = {
    past: reducer(undefined, {
      type: undefined,
    }),
    present: reducer(undefined, {
      type: undefined,
    }),
    future: reducer(undefined, {
      type: undefined,
    }),
  };

  const undoSlice = createSlice({
    name: 'undo',
    initialState,
    reducers: {
      undoAction: (state, action) => {
        const previous = state.past;
        const newPast = reducer(undefined, {
          type: undefined,
        });
        return {
          past: newPast,
          present: previous,
          future: state.present,
        };
      },
      /*
      redoAction: (state, action) => {
        const next = state.future;
        const newFuture = reducer(undefined, {});
        return {
          past: state.present,
          present: next,
          future: newFuture,
        };
      },*/
    },
    extraReducers: (builder) => {
      builder.addDefaultCase((state, action) => {
        console.log(current(state));
        state.past = JSON.parse(JSON.stringify(state.present));
        const newPresent = reducer(state.present, action);
        state.present = newPresent;
        console.log(current(state));
        // console.log(state.past === state.present);
        //return state;
        //console.log(current(newPresent));
        //if (state.present === newPresent) {
        //   return state;
        //}
        //console.log('afterrr');
        /*
        return {
          past: state.present,
          present: newPresent,
          future: reducer(undefined, {
            type: undefined,
          }),
        };*/
      });
    },
  });

  return undoSlice;
};

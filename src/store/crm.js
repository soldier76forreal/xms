import { createSlice, createAsyncThunk , configureStore, current } from '@reduxjs/toolkit';
import axios from 'axios';
import { useSelector } from 'react-redux';
import thunk from 'redux-thunk'; // Import the redux-thunk middleware
import { getImageSize  } from 'react-image-size';
const dataSlice = createSlice({
  name: 'storeCrm',
  initialState: {},

});
export const { actions, reducer } = dataSlice;
  const storeCrm = configureStore({
      reducer: dataSlice.reducer,
      middleware: [thunk] // Include the redux-thunk middleware
  }
 )
 

 export default storeCrm;
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AxiosGlobalProvider } from './components/authAndConnections/axiosGlobalUrl';
import {BrowserRouter} from "react-router-dom";

import './App.scss';
import allReducers from './redux/reducers';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material';
import { WebSectionsProvider } from './contextApi/webSection';
import { GetDatasProvider } from './contextApi/getDatas';
import { AuthContextProvider } from './components/authAndConnections/auth';

const store = createStore(allReducers);
const root = ReactDOM.createRoot(document.getElementById('root'));
const THEME = createTheme({
  typography: {
   "fontFamily": `"YekanRegular", sans-serif`,
  }
});
root.render(
  <React.StrictMode>
          <BrowserRouter>
            <AxiosGlobalProvider>
    <ThemeProvider theme={THEME}>
      <AuthContextProvider>

      <GetDatasProvider>

      <WebSectionsProvider>
  
      
          <Provider store={store}>
                <App />
            </Provider>

        </WebSectionsProvider>
      </GetDatasProvider>
      </AuthContextProvider>

        </ThemeProvider>
            </AxiosGlobalProvider>
          </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

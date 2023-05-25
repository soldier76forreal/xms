import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AxiosGlobalProvider } from './components/authAndConnections/axiosGlobalUrl';
import {BrowserRouter} from "react-router-dom";

import './App.scss';

import { createTheme, ThemeProvider } from '@mui/material';
import { WebSectionsProvider } from './contextApi/webSection';
import { AuthContextProvider } from './components/authAndConnections/auth';
import { SocketContextProvider } from './components/authAndConnections/socketReq';
import { Provider } from 'react-redux';
import store from './store/fileManager';



const root = ReactDOM.createRoot(document.getElementById('root'));
const THEME = createTheme({
  typography: {
   "fontFamily": `"YekanRegular", sans-serif`,
  }
});
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <BrowserRouter>
      <AxiosGlobalProvider>
        <ThemeProvider theme={THEME}>
          <AuthContextProvider>
            
              <WebSectionsProvider>
               
                  <SocketContextProvider>
                   
                    <App />
                  </SocketContextProvider>
            
              </WebSectionsProvider>
           
          </AuthContextProvider>
        </ThemeProvider>
      </AxiosGlobalProvider>
    </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

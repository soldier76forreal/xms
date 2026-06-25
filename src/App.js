import { Route, Switch, Redirect } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import { ThemeContextProvider } from './contextApi/themeContext';
import ThemeCtx from './contextApi/themeContext';

import Crm from './components/crm/crm';
import NewCustomer from './components/crm/newCustomer';
import Main from './components/main/main';
import Mis from './components/mis/mis';
import Users from './components/mis/users';
import LogIn from './components/authAndConnections/logIn';
import AuthContext from './components/authAndConnections/auth';
import { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AxiosGlobal from './components/authAndConnections/axiosGlobalUrl';
import { fetchData, getAllTags, getContacts, getCustomers, getFilter, getInvoices, getProductsTree, userProfileData } from './store/store';
import { useDispatch, useSelector } from 'react-redux';
import ShowTheLink from './components/fileManager/showTheLink';
import { useHistory, useLocation, Link } from "react-router-dom";
import SnackBar from './tools/navs/snackBar';
import Projects from './components/projectManager/projects';

// Inner component so it can consume ThemeCtx after the provider mounts
const ThemedApp = () => {
  const { themeMode } = useContext(ThemeCtx);
  const authCtx = useContext(AuthContext);
  const [notifs, setNotifs] = useState('');
  const [count, setCount] = useState(0);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const refresh = useSelector((state) => state.refresh);
  const history = useHistory();
  const crmRefresh = useSelector((state) => state.crmRefresh);
  const misRefresh = useSelector((state) => state.misRefresh);
  const refreshTag = useSelector((state) => state.refreshTag);
  const productRefresh = useSelector((state) => state.productRefresh);
  const userProfileRefresh = useSelector((state) => state.userProfileRefresh);

  if (localStorage.getItem('accessToken') === 'undefined') {
    localStorage.removeItem('accessToken');
  }

  useEffect(() => {}, [refresh]);

  useEffect(() => {
    dispatch(fetchData({ authCtx, axiosGlobal }));
  }, [refresh, refreshTag]);

  useEffect(() => {
    dispatch(getContacts({ authCtx, axiosGlobal }));
  }, []);

  useEffect(() => {
    dispatch(getFilter({ authCtx, axiosGlobal }));
  }, [crmRefresh, misRefresh]);

  useEffect(() => {
    dispatch(getCustomers({ authCtx, axiosGlobal }));
  }, [crmRefresh]);

  useEffect(() => {
    dispatch(getAllTags({ authCtx, axiosGlobal }));
  }, [refreshTag]);

  useEffect(() => {
    dispatch(userProfileData({ authCtx, axiosGlobal }));
  }, [userProfileRefresh]);

  useEffect(() => {
    dispatch(getInvoices({ authCtx, axiosGlobal }));
  }, [misRefresh]);

  useEffect(() => {
    dispatch(getProductsTree({ authCtx, axiosGlobal }));
  }, [productRefresh]);

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <SnackBar />

      <Switch>
        <Route path="/logIn" exact>
          {authCtx.isLoggedIn === true ? <Redirect to="/" /> : <LogIn />}
        </Route>

        {authCtx.isLoggedIn === true ? (
          <Route exact path="/">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route exact path="/newCustomer">
            <NewCustomer />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/files">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/mis">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/jobReport">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/crm">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/projects">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route path="/inventory">
            <Main />
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        {authCtx.isLoggedIn === true ? (
          <Route exact path="/users">
            {authCtx.access.includes('sa') === true ? (
              <Users />
            ) : (
              <Redirect to="/" />
            )}
          </Route>
        ) : (
          <Redirect to="/logIn" />
        )}

        <Route path="/showLink">
          <ShowTheLink />
        </Route>
      </Switch>
    </ThemeProvider>
  );
};

function App() {
  // service worker reg
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceWorker.js').then(() => {
      console.log('activated');
    });
  }

  return (
    <ThemeContextProvider>
      <ThemedApp />
    </ThemeContextProvider>
  );
}

export default App;

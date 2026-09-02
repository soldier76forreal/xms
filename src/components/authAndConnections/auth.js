import React, { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useHistory } from 'react-router-dom';
import { io } from 'socket.io-client';
import AxiosGlobal from './axiosGlobalUrl';

axios.defaults.withCredentials = true;

const safeJwtDecode = (token) => {
  try {
    return token ? jwtDecode(token) : null;
  } catch (error) {
    return null;
  }
};

const AuthContext = React.createContext({
  token: null,
  userId: '',
  decode: {},
  access: [],
  isLoggedIn: false,
  isOnline: true,
  login: (token) => {},
  logout: () => {},
  jwtInst: null,
  socket: null,
});

export const AuthContextProvider = (props) => {
  const savedToken = localStorage.getItem('accessToken');
  const initialToken = savedToken && savedToken !== 'undefined' ? savedToken : null;
  const initialDecoded = safeJwtDecode(initialToken);
  const axiosGlobal = useContext(AxiosGlobal);

  const [token, setToken] = useState(initialDecoded ? initialToken : null);
  const [decoded, setDecoded] = useState(initialDecoded);
  const [userId, setUserId] = useState(decoded?.id || '');
  const [accessSection, setAccessSection] = useState(decoded?.access || []);
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const history = useHistory();
  const userIsLoggedIn = !!token && !!decoded;

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (initialToken && !initialDecoded) {
      localStorage.removeItem('accessToken');
    }
  }, []);

  const requestQueue = useRef([]);

  const jwt = axios.create({
    baseURL: axiosGlobal.authTargetApi,
    withCredentials: true,
  });

  const postRefreshToken = async () => {
    try {
      const response = await axios.post(
        `${axiosGlobal.authTargetApi}/auth/refreshToken`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const isNetworkError = error.code === 'ERR_NETWORK' || !navigator.onLine;
      if (!isNetworkError) {
        logOutHandler();
      }
      throw error;
    }
  };

  const deleteRefreshToken = async () => {
    try {
      await axios.post(
        `${axiosGlobal.authTargetApi}/auth/deleteRefreshToken`,
        {},
        { withCredentials: true }
      );
    } catch (error) {}
  };

  const logOutHandler = () => {
    setToken(null);
    setDecoded(null);
    setUserId('');
    setAccessSection([]);
    localStorage.removeItem('accessToken');
    deleteRefreshToken();
    history.push('/logIn');
  };

  const logInHandler = (newToken) => {
    const newDecoded = safeJwtDecode(newToken);
    if (!newDecoded) {
      logOutHandler();
      return;
    }
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    setDecoded(newDecoded);
    setUserId(newDecoded.id);
    setAccessSection(newDecoded.access || []);
  };

  const processQueue = async () => {
    while (requestQueue.current.length > 0 && navigator.onLine) {
      const { config, resolve, reject } = requestQueue.current.shift();
      try {
        const response = await jwt(config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
  };

  jwt.interceptors.request.use(
    async (config) => {
      if (!navigator.onLine) {
        return new Promise((resolve, reject) => {
          requestQueue.current.push({ config, resolve, reject });
        });
      }

      const now = Date.now();
      let currentToken = tokenRef.current;

      if (currentToken) {
        const decodedToken = safeJwtDecode(currentToken);
        if (!decodedToken) {
          logOutHandler();
          throw new Error('Invalid token');
        }

        if (decodedToken.exp * 1000 < now) {
          const refreshed = await postRefreshToken();

          if (refreshed?.accessToken) {
            const refreshedDecoded = safeJwtDecode(refreshed.accessToken);
            if (!refreshedDecoded) {
              logOutHandler();
              throw new Error('Invalid refreshed token');
            }
            localStorage.setItem('accessToken', refreshed.accessToken);
            setToken(refreshed.accessToken);
            setDecoded(refreshedDecoded);
            setUserId(refreshedDecoded.id || '');
            setAccessSection(refreshedDecoded.access || []);
            currentToken = refreshed.accessToken;
            config.headers['Authorization'] = `Bearer ${currentToken}`;
          } else {
            logOutHandler();
            throw new Error('Token refresh failed');
          }
        } else {
          config.headers['Authorization'] = `Bearer ${currentToken}`;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const onOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const newSocket = io(axiosGlobal.defaultTargetApi);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (token && socket) {
      const tokenData = safeJwtDecode(token);
      if (tokenData?.id) {
        // ghostSessionId (present only on a ghost token — see tools/ghost.js)
        // tells the backend to skip presence writes for this connection: a
        // ghost session must never mark the impersonated user online, flip
        // their real lastSeen, or steal a ref-count slot from a real
        // concurrent session of that same account. See the 'newUser' handler
        // in api/routes/socket/xmsNotifications.js.
        socket.emit('newUser', { userId: tokenData.id, ghostSessionId: tokenData.ghostSessionId || null });
      }
    }
  }, [socket, token]);

  const contextValue = {
    token,
    decode: decoded,
    access: accessSection,
    userId,
    isLoggedIn: userIsLoggedIn,
    isOnline,
    login: logInHandler,
    logout: logOutHandler,
    jwtInst: jwt,
    socket,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

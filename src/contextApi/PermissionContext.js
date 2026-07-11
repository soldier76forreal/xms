import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AuthContext from '../components/authAndConnections/auth';
import AxiosGlobal from '../components/authAndConnections/axiosGlobalUrl';

const SCOPE_RANK = { mine: 1, group: 2, all: 3 };

const PermissionContext = createContext({
  permissions: new Set(),
  dataScopes:  {},
  isSuperAdmin: false,
  can:      () => false,
  scopeFor: () => 'all',
  refreshPermissions: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export const PermissionProvider = ({ children }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const location    = useLocation();

  const [permissions, setPermissions] = useState(new Set());
  const [dataScopes,  setDataScopes]  = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // true once the FIRST successful fetch has landed — route guards must not
  // redirect off the empty initial set while permissions are still loading.
  const [ready, setReady] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!authCtx.isLoggedIn) {
      setPermissions(new Set());
      setDataScopes({});
      setIsSuperAdmin(false);
      setReady(false);
      return;
    }
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users/me/permissions`,
      });
      setPermissions(new Set(res.data.permissions || []));
      setDataScopes(res.data.dataScopes || {});
      setIsSuperAdmin(!!res.data.isSuperAdmin);
      setReady(true);
    } catch {
      setPermissions(new Set());
      setDataScopes({});
      setIsSuperAdmin(false);
    }
  }, [authCtx.isLoggedIn, authCtx.jwtInst, axiosGlobal.defaultTargetApi]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  useEffect(() => {
    if (authCtx.isLoggedIn) fetchPermissions();
  }, [location.pathname]);   // eslint-disable-line react-hooks/exhaustive-deps

  const can = (key) => permissions.has(key);

  // Returns the effective scope for a module: 'mine' | 'group' | 'all'
  // If no restriction is set for this module, defaults to 'all'.
  const scopeFor = (module) => dataScopes[module] || 'all';

  return (
    <PermissionContext.Provider value={{ permissions, dataScopes, isSuperAdmin, ready, can, scopeFor, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

// ── usePermissions hook ───────────────────────────────────────────────────────
export const usePermissions = () => useContext(PermissionContext);

// ── <Can> component — UX gate only ───────────────────────────────────────────
// Renders children when the user has the given permission key.
// fallback renders when they don't (default: nothing).
export const Can = ({ permission, children, fallback = null }) => {
  const { can } = useContext(PermissionContext);
  return can(permission) ? children : fallback;
};

export default PermissionContext;

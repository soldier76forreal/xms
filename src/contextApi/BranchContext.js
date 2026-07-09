import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from '../components/authAndConnections/auth';
import AxiosGlobal from '../components/authAndConnections/axiosGlobalUrl';

// Inventory + MIS are fully isolated per branch (see CLAUDE.md multi-branch
// spec). This context fetches the branches the logged-in user is assigned to
// (GET /branches already server-filters to the caller's own branches — or
// all branches for a superAdmin), holds which one is "active" right now
// (persisted in localStorage so it survives a refresh), and is the single
// source of truth every Inventory/MIS screen reads branchId from.

const STORAGE_KEY = 'xms_activeBranchId';

const BranchContext = createContext({
  branches: [],
  activeBranchId: null,
  activeBranch: null,
  loading: true,
  setActiveBranchId: () => {},
  refreshBranches: () => {},
});

export const BranchProvider = ({ children }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [branches, setBranches]   = useState([]);
  const [activeBranchId, setActiveBranchIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading]     = useState(true);

  const setActiveBranchId = useCallback((id) => {
    setActiveBranchIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchBranches = useCallback(async () => {
    if (!authCtx.isLoggedIn) {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches` });
      const list = res.data || [];
      setBranches(list);
      // If the stored active branch is no longer valid for this user (or
      // nothing was ever picked), fall back to the first available branch.
      setActiveBranchIdState((prev) => {
        const stillValid = prev && list.some((b) => String(b._id) === String(prev));
        const next = stillValid ? prev : (list[0]?._id || null);
        if (next) localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    } catch {
      setBranches([]);
    }
    setLoading(false);
  }, [authCtx.isLoggedIn, authCtx.jwtInst, axiosGlobal.defaultTargetApi]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const activeBranch = branches.find((b) => String(b._id) === String(activeBranchId)) || null;

  return (
    <BranchContext.Provider value={{
      branches, activeBranchId, activeBranch, loading,
      setActiveBranchId, refreshBranches: fetchBranches,
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);

export default BranchContext;

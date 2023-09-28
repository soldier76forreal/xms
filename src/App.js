import logo from './logo.svg';
import {Route , Switch   , Redirect} from "react-router-dom";
import './App.scss';

import Crm from './components/crm/crm';
import NewCustomer from './components/crm/newCustomer';
import Main from './components/main/main';
import Mis from './components/mis/mis';
import Users from './components/mis/users';
import LogIn from './components/authAndConnections/logIn';
import AuthContext from './components/authAndConnections/auth';
import { useContext  , useEffect , useState} from 'react';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import axios from 'axios';
import AxiosGlobal from './components/authAndConnections/axiosGlobalUrl';
import { fetchData , getAllTags, getContacts, getCustomers, getFilter, getInvoices } from './store/store';
import { useDispatch, useSelector } from 'react-redux';
import ShowTheLink from './components/fileManager/showTheLink';
import { useHistory, useLocation , Link } from "react-router-dom";




function App() {
  // service worker reg
  if('serviceWorker' in navigator ){
    navigator.serviceWorker
    .register('/serviceWorker.js')
    .then(()=>{
      console.log('activated')
    })
  }


  const authCtx = useContext(AuthContext);
  const [notifs,setNotifs] = useState('')
  const [count,setCount] = useState(0)
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch  = useDispatch()
  const refresh = useSelector((state) => state.refresh);
  const history = useHistory()
  const crmRefresh = useSelector((state) => state.crmRefresh);
  const misRefresh = useSelector((state) => state.misRefresh);
  const refreshTag = useSelector((state) => state.refreshTag);

  if(localStorage.getItem('accessToken') === 'undefined'){
    localStorage.removeItem('accessToken')
  }
  useEffect(() => {
    if(window.location.pathname !== '/showLink'){
    }

  }, [refresh]);

  useEffect(() => {
    dispatch(fetchData({authCtx , axiosGlobal}))
  }, [refresh , refreshTag]);

  useEffect(() => {
    dispatch(getContacts({authCtx , axiosGlobal}))
  }, []);

  useEffect(() => {
    dispatch(getFilter({authCtx , axiosGlobal}))
  }, [crmRefresh ,misRefresh]);
  
  useEffect(() => {
    dispatch(getCustomers({authCtx , axiosGlobal}))
  }, [crmRefresh]);


  useEffect(() => {
    dispatch(getAllTags({authCtx , axiosGlobal}))
}, [refreshTag]);

useEffect(() => {
  dispatch(getInvoices({authCtx , axiosGlobal}))
}, [misRefresh]);
  // function notifyMe() {
  //   if (!("Notification" in window)) {
  //     // Check if the browser supports notifications
  //     alert("This browser does not support desktop notification");
  //   } else if (Notification.permission === "granted") {
  //     // Check whether notification permissions have already been granted;
  //     // if so, create a notification
  //     // …
  //   } else if (Notification.permission !== "denied") {
  //     // We need to ask the user for permission
  //     Notification.requestPermission().then((permission) => {
  //       // If the user accepts, let's create a notification
  //       if (permission === "granted") {
  //         // …
  //       }
  //     });
  //   }
  
  //   // At last, if the user has denied notifications, and you
  //   // want to be respectful there is no need to bother them anymore.
  // }


  // useEffect(() => {
  //   notifyMe()
  // }, [authCtx.token]);




  // const getSubscription = async () => {
  //   const subscription = await navigator.serviceWorker
  //     .getRegistration() //
  //     .then((registration) => {
  //       return registration.pushManager.subscribe({
  //         userVisibleOnly: true,
  //         applicationServerKey:'BM67mHEyeX_8ChNMsQGcVkgE965usqKz0LTBppeporoWbviq6zPdH2EELVIK2QnlL5MLYqIzf-0-qxdWtBAd5w4'
  //       });
  //     });
  //   // in production we would send it directly to our server and not store it on the window
  //     try{
  //       const response = await authCtx.jwtInst({
  //           method:'post',
  //           url:`${axiosGlobal.defaultTargetApi}/notfication/saveSubsToDb`,
  //           data:{subs:JSON.stringify(subscription) , userId:jwtDecode(authCtx.token).id},
  //           config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
  //       })
  //     }catch(err){
  //         console.log(err)
  //     }
  // };
  
  //     useEffect(() => {
  //       getSubscription()
  //     },[authCtx.token]);
  return (
    <div>
        <Switch>
            <Route path="/logIn" exact>
                {authCtx.isLoggedIn ===true?
                    <Redirect to='/'></Redirect>
                    :
                    <LogIn/>
                }
            </Route>
            {authCtx.isLoggedIn === true ?
            <Route exact path="/"> 
                <Main/>
            </Route>
          :<Redirect to='/logIn'/>}
            {/* <Route path="/crm"  exact>
                {authCtx.isLoggedIn ===true?
                    <Crm/>
                    :
                    <Redirect to='/'></Redirect>
                }
            </Route> */}
            {authCtx.isLoggedIn === true ?
            <Route exact path="/newCustomer"> 
                <NewCustomer/>
            </Route>
          :<Redirect to='/logIn'/>}
          {authCtx.isLoggedIn === true ?
            <Route  path="/files"> 
                <Main/>
            </Route>
          :<Redirect to='/logIn'/>}
          {authCtx.isLoggedIn === true ?
            <Route  path="/mis"> 
                <Main/>
            </Route>
          :<Redirect to='/logIn'/>}
          {authCtx.isLoggedIn === true ?
            <Route  path="/jobReport"> 
                <Main/>
            </Route>
          :<Redirect to='/logIn'/>}
          {authCtx.isLoggedIn === true ?
            <Route  path="/crm"> 
                <Main/>
            </Route>
          :<Redirect to='/logIn'/>}
            {authCtx.isLoggedIn === true ?
            <Route exact path="/users"> 
                
                {jwtDecode(JSON.stringify(localStorage.getItem('accessToken'))).access.includes('sa') === true?
                
                    <Users/>
                    :
                    <Redirect to='/'></Redirect>
                }
            </Route>
          :<Redirect to='/logIn'/>}

          <Route  path="/showLink">  
            <ShowTheLink/>
          </Route>
        </Switch>

    </div>
  );
}

export default App;

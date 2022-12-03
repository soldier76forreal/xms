import logo from './logo.svg';
import {Route , Switch   , Redirect} from "react-router-dom";
import './App.scss';

import Crm from './components/crm/crm';
import NewCustomer from './components/crm/newCustomer';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCustomerData } from './redux/actions';
import Main from './components/main/main';
import Mis from './components/mis/mis';
import Users from './components/mis/users';
import LogIn from './components/authAndConnections/logIn';
import AuthContext from './components/authAndConnections/auth';
import { useContext } from 'react';


function App() {
  const getCustomerData =  useSelector(state => state.GetCustomerData);
  const authCtx = useContext(AuthContext);
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
            {/* <Route path="/crm"  exact>
                {authCtx.isLoggedIn ===true?
                    <Crm/>
                    :
                    <Redirect to='/'></Redirect>
                }
            </Route> */}
            <Route path="/" exact>
                <Main/>
            </Route>
            <Route path="/newCustomer" exact>
                <NewCustomer/>
            </Route>    
            <Route path="/users" exact>
                {authCtx.access.includes('sa')?
                    <Users/>
                    :
                    <Redirect to='/'></Redirect>
                }
                
            </Route>
        </Switch>

    </div>
  );
}

export default App;

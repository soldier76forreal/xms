import logo from './logo.svg';
import {Route , Switch , Redirect} from "react-router-dom";
import './App.scss';


import Crm from './components/crm/crm';
import NewCustomer from './components/crm/newCustomer';

function App() {
  return (
    <div>
        <Switch>
            <Route path="/crm" exact>
                <Crm/>
            </Route>
            <Route path="/newCustomer" exact>
                <NewCustomer/>
            </Route>
        </Switch>

    </div>
  );
}

export default App;

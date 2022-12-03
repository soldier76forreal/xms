//css
import Style from './crm.module.scss';
//hooks
import { Fragment } from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//imports
import NormalTopFilterSection from '../../tools/crm/normalTopFilterSection';
import CustomerTable from '../../tools/crm/customerTable';


const Crm = (props) =>{
    
    return(
        <Fragment>
                <div style={{maxWidth:'1600px'}} dir='rtl' className={Style.ovDiv}>
                    <NormalTopFilterSection></NormalTopFilterSection>
                    <div className={Style.dashLine}></div>
                <div dir='ltr'>
                    <CustomerTable></CustomerTable>
                </div>
                </div>

        </Fragment>
    )
}
export default Crm;
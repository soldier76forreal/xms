
//css
import Style from './normalTopFilterSection.module.scss';
//hooks
import { Fragment } from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//components
import DropDownMenu from '../../tools/inputs/dropDownMenu';
import SearchBarV2 from '../../tools/crm/searchBarV2';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useHistory } from 'react-router-dom';
const NormalTopFilterSection =(props)=>{
    const history = useHistory();
    return(
        <Fragment>
            <Row>
                <Col sm={12} md={12} lg={8} xl={8} xxl={8} xs={8}>
                    <div className={Style.firstSectionDiv}>
                        <h3>مشتری ها</h3>
                        <div className={Style.dashLine}></div>
                        <h4>فیلتر براساس:</h4>
                        <div dir='ltr'>
                            <div style={{display:'inline-block'}}>
                                <DropDownMenu width={120}></DropDownMenu>
                            </div>
                            <div style={{display:'inline-block'}}>
                                <DropDownMenu width={160}></DropDownMenu>
                            </div>
                            <div style={{display:'inline-block'}}>
                                <DropDownMenu width={120}></DropDownMenu>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                        <div className={Style.leftSection} dir='rtl'>
                            <div style={{display:'inline-block'}}>
                                <SearchBarV2></SearchBarV2>
                            </div>
                            <div style={{display:'inline-block'}}>
                                <button onClick={()=>{history.push('/newCustomer')}}>مشتری جدید<AddCircleIcon sx={{fontSize:'30px' , marginRight:'8px'}}></AddCircleIcon></button>
                            </div>
                        </div>
                </Col>
            </Row>
        </Fragment>
    )
}
export default NormalTopFilterSection;
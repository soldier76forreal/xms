//css
import Style from './newCustomer.module.scss';
//hooks
import { Fragment  , React} from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//imports
import NormalTopFilterSection from '../../tools/crm/normalTopFilterSection';
import CustomerTable from '../../tools/crm/customerTable';
import BigOneWithDot from '../../tools/titles/bigOneWithDot';
import TextInputNormal from '../../tools/inputs/textInputNormal';
import CustomSelect from '../../tools/inputs/customSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import MultiSelect from '../../tools/inputs/multiSelect';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LittleOneNormal from '../../tools/titles/littleOneNormal';
import NormalBtn from '../../tools/buttons/normalBtn';


const NewCustomer = () =>{
    return(
        <Fragment>
            
                <div className={Style.ovDiv}  dir='rtl'  style={{maxWidth:'1600px'}}>
                    <BigOneWithDot text="مشخصات فردی"></BigOneWithDot>
                    <div className={Style.personalInformation}>
                        <Row className="g-0">
                            <Col sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect placeholder="کشور"></CustomSelect>
                            </Col>
                            <Col sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect placeholder="عنوان"></CustomSelect>
                            </Col>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <TextInputNormal placeholder="نام"></TextInputNormal>
                            </Col>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <TextInputNormal placeholder="نام خانوادگی"></TextInputNormal>
                            </Col>
                        </Row>
                        <Row className="g-0" style={{padding:'15px 0px 5px 0px'}}>
                            <Col sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect placeholder="نوع مشتری"></CustomSelect>
                            </Col>
                            <Col sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect placeholder="جذب شده از طریق"></CustomSelect>
                            </Col>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <TextInputNormal></TextInputNormal>
                            </Col>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <MultiSelect></MultiSelect>
                            </Col>
                        </Row>
                    </div>
                    <hr className={Style.dashLine}></hr>
                    <div>
                        <BigOneWithDot text="اطلاعات تماس"></BigOneWithDot>

                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='شماره تماس'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>

                            </div>

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton text={true} icon={<AddIcon sx={{color:'#0076FF'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                        <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <div className={Style.phoneNumberMainDiv}>
                                    <div className={Style.dot}></div>
                                    <IconBotton text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                </div>
                                
                            </Col>
                            <Col  style={{padding:'0px'}} sm={12} md={12} lg={3} xl={3} xxl={3} xs={3}>
                                <TextInputNormal></TextInputNormal>
                            </Col>

                        </Row>
                        <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <div className={Style.phoneNumberMainDiv}>
                                    <div className={Style.dot}></div>
                                    <IconBotton text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                </div>
                                
                            </Col>
                            <Col  style={{padding:'0px'}} sm={12} md={12} lg={3} xl={3} xxl={3} xs={3}>
                                <TextInputNormal></TextInputNormal>
                            </Col>

                        </Row>
                        <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                            <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <div className={Style.phoneNumberMainDiv}>
                                    <div className={Style.dot}></div>
                                    <IconBotton text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                    <div className={Style.phoneNumberCountry}>
                                        <CustomSelect placeholder="عنوان"></CustomSelect>
                                    </div>
                                </div>
                                
                            </Col>
                            <Col  style={{padding:'0px'}} sm={12} md={12} lg={3} xl={3} xxl={3} xs={3}>
                                <TextInputNormal></TextInputNormal>
                            </Col>

                        </Row>
                    </div>
                    
                    <div> 
                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='ایمیل'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>

                            </div>

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton text={true} icon={<AddIcon sx={{color:'#0076FF'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                        <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                            <div className={Style.phoneNumberMainDiv}>
                                <div className={Style.dot}></div>
                                <IconBotton text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                <div className={Style.phoneNumberCountry}>
                                <TextInputNormal></TextInputNormal>
                                </div>

                            </div>
                        </Col>
                    </div>
                    <hr className={Style.dashLine}></hr>

                    <div>
                        <BigOneWithDot text="آدرس"></BigOneWithDot>
                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='ایمیل'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton text={true} icon={<AddIcon sx={{color:'#0076FF'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                        <Row className="g-0">

                            <Col style={{padding:'0px'}} sm={12} md={12} lg={1} xl={1} xxl={1} xs={1}>
                                <div className={Style.addressDeleteBtnWithIcon} >
                                    <IconBotton text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                </div>
                            </Col>
                            <Col style={{padding:'0px'}} sm={12} md={12} lg={11} xl={11} xxl={11} xs={11}>
                                <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={5} xl={5} xxl={5} xs={5}>
                                        <div className={Style.phoneNumberMainDiv}>
                            
                                            <div className={Style.phoneNumberCountry}>
                                                <CustomSelect placeholder="عنوان"></CustomSelect>
                                            </div>
                                            <div className={Style.phoneNumberCountry}>
                                                <CustomSelect placeholder="عنوان"></CustomSelect>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={5} xl={5} xxl={5} xs={5}>
                                        <div className={Style.phoneNumberMainDiv}>                 
                                            <div className={Style.phoneNumberCountry}>
                                                <CustomSelect placeholder="عنوان"></CustomSelect>
                                            </div>
                                            <div className={Style.phoneNumberCountry}>
                                                <TextInputNormal></TextInputNormal>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                        <div className={Style.phoneNumberMainDiv}>                 
                                            <div className={Style.phoneNumberCountry}>
                                                <TextInputNormal></TextInputNormal>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={6} xl={6} xxl={6} xs={6}>
                                        <div className={Style.phoneNumberMainDiv}>                 
                                            <div style={{maxWidth:'30%'}} className={Style.phoneNumberCountry}>
                                                <TextInputNormal></TextInputNormal>
                                            </div>
                                            <div style={{maxWidth:'70%'}} className={Style.phoneNumberCountry}>
                                                <TextInputNormal></TextInputNormal>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={6} xl={6} xxl={6} xs={6}>
                                        <div className={Style.phoneNumberMainDiv}>                 

                                            <div className={Style.phoneNumberCountry}>
                                                <TextInputNormal></TextInputNormal>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                    <div>
                        <Row className="g-0" style={{padding:'0px'}}>
                            <Col style={{padding:'0px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <div style={{width:'100%'}}>
                                    <button className={Style.NormalBtn}>ذخیره</button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
        </Fragment>
    )
}
export default NewCustomer;
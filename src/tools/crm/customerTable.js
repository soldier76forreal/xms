//modules
import Style from './customerTable.module.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Navbar  , Nav ,NavDropdown ,Form ,FormControl ,Button} from 'react-bootstrap';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CallIcon from '@mui/icons-material/Call';
import WhatsApp from '@mui/icons-material/WhatsApp';
import prof from '../../assets/imagePlaceHolder.png';
import flag from '../../assets/per.png';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {useContext} from 'react';
import AddIcon from '@mui/icons-material/Add';
const CustomerTable = (props) =>{
    
    return(
        <div  className={Style.cardDiv}>
            <table id="datatables-1" style={{width:"100%"}} className={`${Style.table} ${Style.table_striped} ${Style.table_bordered}`}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>نام و نام خانوادگی</th>
                            <th style={{left:"0px" , margin:'0px' , width:'760px'}}>آخرین محصول درخواستی</th>
                            <th style={{left:"0px" , margin:'0px' , width:'140px'}}>ثبت شده توسط</th>
                            <th style={{left:"0px" , margin:'0px' , width:'110px'}}>آخرین تماس</th>
                            <th style={{left:"0px" , margin:'0px' , width:'0px'}}>واتساپ</th>
                            {/* <th style={{left:"0px" , margin:'0px' , width:'70px'}}></th> */}
                            <th style={{left:"0px" , margin:'0px' , width:'0px'}}>تماس</th>
                            <th style={{left:"0px" , margin:'0px' , width:'0px'}}>ویرایش</th>
                        </tr>
                    </thead>
                    <tbody style={{borderRadius:'20px'}}>
                       
                                <tr>
                                     <td s>
                                        <div className={Style.rightSideFunctionBtn}><MoreVertIcon></MoreVertIcon></div>
                                    </td>
                                    <td style={{borderRadius:'0px 11px 11px 0px'}}>
                                        <div  className={Style.profDiv}>
                                            <div className={Style.dot}></div>
                                            <img alt='vsvs' title="svsv" className={Style.profImg} src={flag}></img>
                                            <h4>svsv</h4>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{width:'100%'}} className={Style.lastProductDiv}>
                                            <div style={{display:'flex' ,alignItems:'center' , alignContent:'center'}} >
                                                <div  className={Style.lastProductAddIcon}><button onClick={props.openEditModal}  value='' style={{border:'none' , background:'none' ,display:'flex' , justifyContent :'center' , alignItems:'center'}} ><AddIcon  className={Style.editIcon} sx={{ fontSize: 22 ,color: '#000000' ,iconHover:'#FFF' }}></AddIcon></button></div>
                                                <h4>svs</h4>    
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={Style.rightSideDiv}>
                                            <h3>vssvs</h3>
                                        </div>
                                    </td>

                                    {/* <td>
                                        <div className={Style.switchDiv}>               
                                            <label className={Style.switch}>
                                                <input type="checkbox" ></input>                
                                                <span  className={`${Style.slider} ${Style.round}`}></span>
                                            </label>
                                        </div>
                                    </td> */}
                                    <td>
                                        <div className={Style.submitDate}>
                                            <h3>1990</h3>
                                        </div>
                                    </td>

                                    <td>
                                        <div className={Style.whatsAppIconDiv}><button onClick={props.openEditModal}  value='' style={{border:'none' , background:'none' ,display:'flex' , justifyContent :'center' , alignItems:'center'}} ><WhatsApp  className={Style.editIcon} sx={{ fontSize: 22 ,color: '#707070' ,iconHover:'#FFF' }}></WhatsApp></button></div>
                                    </td>
                                    <td>
                                        <div onClick={()=>{props.setNewCallStatus({status:true , id:''})}} className={Style.callIconDiv}><button onClick={props.openEditModal}  value='' style={{border:'none' , background:'none' ,display:'flex' , justifyContent :'center' , alignItems:'center'}} ><CallIcon  className={Style.editIcon} sx={{ fontSize: 22,color: '#707070' ,iconHover:'#FFF' }}></CallIcon></button></div>
                                    </td>
                                    {/* <td>
                                    <div className={Style.dashLine}></div>

                                    </td> */}
                                    <td style={{padding:'15px 0px 15px 0px'}}>

                                        <div className={Style.editIconDiv}><button onClick={props.openEditModal}  value='' style={{border:'none' , background:'none' ,display:'flex' , justifyContent :'center' , alignItems:'center'}} ><EditIcon  className={Style.editIcon} sx={{ fontSize: 22,color: '#fff' ,iconHover:'#FFF' }}></EditIcon></button></div>
                                    </td>
                                </tr>
                        
                    </tbody>
                </table>

							
            {/* <div className={Style.rightSideDiv}>
                <h3>تراورتن</h3>
            </div>
            <div className={Style.leftSideDiv}>
                <div className={Style.deleteIconDiv}><DeleteIcon className={Style.deleteIcon} sx={{ fontSize: 35,color: '#FD7474' ,iconHover:'#FFF' }}></DeleteIcon></div>
                <div className={Style.editIconDiv}><EditIcon className={Style.editIcon} sx={{ fontSize: 35,color: '#354063' ,iconHover:'#FFF' }}></EditIcon></div>
                <div className={Style.switchDiv}>               
                     <label className={Style.switch}>
                          <input   type="checkbox" ></input>                
                         <span  className={`${Style.slider} ${Style.round}`}></span>
                    </label>
                </div>
                <div className={Style.submitDate}>
                    <h3>1400/09/04</h3>
                </div>
                <div className={Style.profDiv}>
                <h4>محمد فلاح</h4>
                    <img className={Style.profImg} src={`${prof}`}></img>
                </div>
            </div> */}
    </div>
    )
}


export default CustomerTable;
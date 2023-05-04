import * as React from 'react';
import Style from './expendUserAc.module.scss'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Avatar from '@mui/material/Avatar';
import WebSections from '../../contextApi/webSection';
import { useContext , useState , useEffect } from 'react';
import AuthContext from '../authAndConnections/auth';
import Prof from '../../assets/prof.jpg';
import FormControlLabel from '@mui/material/FormControlLabel';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import EditIcon from '@mui/icons-material/Edit';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import MultiSelect from '../../tools/inputs/multiSelect';
import jwtDecode from 'jwt-decode';
import { Switch } from '@mui/material';
import { Stack } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import withReactContent from 'sweetalert2-react-content'    

import Swal from 'sweetalert2';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import SuccessMsg from '../../tools/navs/successMsg';
import UserEdit from './userEdit';
export default function ExpendUserAc(props) {
  const webSections = useContext(WebSections);
  const authCtx = useContext(AuthContext)
  const [successToast , setSuccessToast] = useState({status:false , msg:''});

  const axiosGlobal = useContext(AxiosGlobal)
  const [access , setAccess] = useState([]);
  const [validation , setValidation] = useState(false);
    const getAccess = async(e) =>{
      setAccess([...e])
      var temp = []
      for(var i = 0 ; e.length > i ; i++){
        temp.push(e[i].value)
      }
      const response = await authCtx.jwtInst({
        method:'post',
        url:`${axiosGlobal.defaultTargetApi}/users/updateAccess`,
        data:{userId:props.data._id , newAccessList:temp},
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
   
    }
    const validationChange = async(e) =>{
      if(validation === true){
        setValidation(false)
      }else if(validation === false){
        setValidation(true)
      }
      const response = await authCtx.jwtInst({
        method:'post',
        url:`${axiosGlobal.defaultTargetApi}/users/changeValidation`,
        data:{userId:props.data._id},
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
   
    }



    const MySwal = withReactContent(Swal)

    const deleteModal = () =>{
        Swal.fire({
            title: 'مطمئن هستید؟',
            text: "این کاربر از لیست کاربر های شما حذف می شود",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'بله',
            cancelButtonText:'خیر'
          }).then((result) => {
            if (result.isConfirmed) {
                deleteDocRec()

            }
          })
    }
    const deleteDocRec = async()=>{

      try{
          const response = await authCtx.jwtInst({
              method:'post',
              url:`${axiosGlobal.defaultTargetApi}/users/deleteUser`,
              data:{ userId:props.data._id},
              config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
          })
          props.setContectRefresh(Math.random());
          setSuccessToast({status:true , msg:'کاربر با موفقیت حذف شد'});
          const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'کاربر با موفقیت حذف شد'})}, 3000);
          
      }catch(err){
          console.log(err);
      }
  }
    useEffect(() => {
      if(props.data !== undefined){

        setValidation(props.data.validation)
        const thirdArray = webSections.listOfSections.filter((elem) => {
          return props.data.access.some((ele) => {
            return ele === elem.value;
            });
          });
          setAccess([...thirdArray])
      }
    }, []);
    if(props.data !== undefined){
      return (
        <div>
          <UserEdit ></UserEdit>
          <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>
          <Accordion dir='rtl'>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>
                <div style={{width:'100%' , display:'flex' , alignItems:'center'}}>
        
                    <Avatar
                    sx={{width:'60px', height:'60px'}}
                    alt={`Avatar n°${1 + 1}`} 
                    src={props.data.profileImage === undefined ? Prof :`${axiosGlobal.authTargetApi}/uploads/${props.data.profileImage.filename}`}
                    />
                    <div>
                        <div style={{fontSize:'18px' , marginRight:'8px' , padding:'0px'}}>{`${props.data.firstName} ${props.data.lastName}`}</div>
                        <div style={{fontSize:'13px' , color:'rgb(69, 69, 69)' , marginRight:'8px' , padding:'0px'}}>{`نقش ها:${props.data.access.map(data=>{
                          for(var i=0 ; webSections.listOfSections.length >i; i++){
                            if(webSections.listOfSections[i].value === data){
                              return(
                                webSections.listOfSections[i].jobTitle
                              )
                            }
                          }
                        })}`}</div>
                    </div>

                </div>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
            <Row>
                  <Col style={{padding:'0px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                    <div style={{display:'flex' , width:'100%' ,alignItems:'center'}}>
                      <Row style={{width:'100%'}}>
                        <Col style={{padding:'0px'}} xs={12} md={6} lg={6} xl={6} xxl={6}>
                          <div className={Style.validationDiv} >
                            <FormControlLabel
                              control={
                                <Switch onChange={validationChange} checked={validation}  name="gilad" />
                              }
                              />
                            {validation === true ?
                              <div className={Style.validation}>کاربر <sapn style={{backgroundColor:'#000' , margin:'0px 1px 0px 1px' , color:'#22e151' ,padding:'3px 8px 3px 8px' , borderRadius:'50px' ,fontFamily:'YekanBold'}}>فعال</sapn> است</div>
                              :validation === false ?
                              <div className={Style.validation}>کاربر <sapn style={{backgroundColor:'#000' ,margin:'0px 1px 0px 1px', color:'#ff1f1f' , padding:'3px 8px 3px 8px' , borderRadius:'50px' ,fontFamily:'YekanBold'}}>غیر فعال</sapn> است</div>
                            :null}
                          </div>
                        </Col>
                        <Col style={{padding:'0px'}} xs={12} md={6} lg={6} xl={6} xxl={6}>
                          <div className={Style.taskBtn} dir='ltr'>
                            <Button onClick={()=>{props.setTargetedEditData(props.data);  props.setOpenEditUser(true)}}  variant="contained" endIcon={<EditIcon />}>
                              ویرایش  
                            </Button>
                            <Button onClick={deleteModal} sx={{color:"red"   , marginLeft:'5px'  , borderColor:'red'}} variant="outlined" >
                            <DeleteIcon />
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
              </Row>
              <Row>
                <div style={{width:'100%' , height:'2px' , backgroundColor:'#e0e0e0' , margin:'6px 0px 6px 0px'}}></div>
              </Row>
              <Row>
                  <Col style={{padding:'5px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                      <div style={{margin:'0px 7px 2px 0px',  fontSize:'16px'}}>نقش ها</div>
                      <MultiSelect onChange={getAccess}  value={access}  options={webSections.listOfSections} setAccess={setAccess}  type='normal' width='100%'></MultiSelect>
                  </Col>
              </Row>

            </AccordionDetails>
          </Accordion>

        </div>
      );
  }
} 
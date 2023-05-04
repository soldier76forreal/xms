import { Fragment , useContext, useState , useEffect} from 'react';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MainNav from '../../tools/navs/mainNav';
import SuccessMsg from '../../tools/navs/successMsg';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ExpendUserAc from './expendUserAc';
import NewUser from './newUser';
import Style from './users.module.scss';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useHistory } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import jwtDecode from 'jwt-decode';
import { CircularProgress } from '@mui/material';
import UserEdit from './userEdit';



const Users = (props) =>{
    const [newUserStatus , setNewUserStatus] = useState(false);
    const [successToast , setSuccessToast] = useState({status:false , msg:''});
    const [data ,setData] = useState({sa:[],inv:[],req:[] , all:[] , allAll:[] , lenght:0})
    const urlContext = useContext(AxiosGlobal);
    const authContext = useContext(AuthContext);
    const [hasMore , setHasMore] = useState(true);
    const [targetedEditData , setTargetedEditData] = useState({});
    const [openEditUser , setOpenEditUser] = useState(false)
    const [contectRefresh , setContectRefresh] = useState(2);
    const [limit , setLimit] = useState(10);
    const [dataForShow , setDataForShow] = useState([])
    const history = useHistory()


    var userList = {sa:[],inv:[],req:[] , all:[] , allAll:[] , lenght:0};
    const getUserData = async() =>{
        try{
            const response = await authContext.jwtInst({
                method:'get',
                url:`${urlContext.defaultTargetApi}/users/getAllUsers`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            userList.sa = response.data.rs.sa;
            userList.inv = response.data.rs.inv;
            userList.req = response.data.rs.req;
            userList.all = response.data.rs.all;
            userList.allAll = response.data.rs.allAll;
            userList.lenght = response.data.ln;
            setData([...userList.allAll])
            setTimeout(()=>{
                var temp = [];
                if(response.data.rs.allAll.length !==0){
                    if(limit>response.data.rs.allAll.length){
                        setLimit(response.data.rs.allAll.length);
                        temp.length =0
                        for(var i = 0 ; i < limit; i++){
                            if(response.data.rs.allAll !== undefined){
                                temp.push(response.data.rs.allAll[i]);
                            }
                        }
                        setDataForShow([...temp])
                        setHasMore(false)
                    }else if(limit<=response.data.rs.allAll.length){
                        setHasMore(true)
                        setLimit(limit+20);
                        temp.length =0
                        for(var j = 0 ; j < limit; j++){
                            if(response.data.rs.allAll[j] !== undefined){
                                temp.push(response.data.rs.allAll[j]);
                            }   
                        }
                        setDataForShow([...temp])
                    }
                }
            }, 1000);
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        getUserData()
    }, [contectRefresh]);

    const notifMore = () =>{
        setTimeout(()=>{
        
            var temp = [];
            if(data.length !==0){
                if(limit>data.length){
                    setLimit(data.length);
                    temp.length =0
                    for(var i = 0 ; i < limit; i++){
                        if(data[i] !== undefined){
                            temp.push(data[i]);
                        }
                    }
                    setDataForShow([...temp])
                    setHasMore(false)
                }else if(limit<=data.length){
                    setHasMore(true)
                    setLimit(limit+20);
                    temp.length =0
                    for(var j = 0 ; j < limit; j++){
                        if(data[j] !== undefined){
                            temp.push(data[j]);
                        }
                        
                    }
                    setDataForShow([...temp])
                }
            }
        }, 1000);
      }
      
    return(
        <Fragment>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>
            <MainNav></MainNav>
            <UserEdit  openEditUser={openEditUser} setOpenEditUser={setOpenEditUser}   setSuccessToast={setSuccessToast} setTargetedEditData={setTargetedEditData}   targetedEditData={targetedEditData}></UserEdit>
            <NewUser setRefresh={setContectRefresh} setSuccessToast={setSuccessToast} newUserStatus = {newUserStatus} setNewUserStatus={setNewUserStatus}></NewUser>
            <OpenIconSpeedDial onClick={()=>{setNewUserStatus(true)}}></OpenIconSpeedDial>
            <div className={Style.usersDiv}>
                <div className={Style.topSection}>
                    <div onClick={()=>{history.push('/')}}  className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'25px'}}></ArrowBackIosIcon></div>
                    <div  className={Style.topTitle}>کاربر ها</div>
                </div>
                <div style={{marginTop:'0px' , overflowY:'scroll'}}>
                    <InfiniteScroll
                            dataLength={dataForShow.length}
                            next={notifMore}
                            hasMore={hasMore}
                            loader={<div style={{display:'flex', marginTop:'10px', justifyContent:'center', alignItem:'center'}}><CircularProgress size='35px' color='inherit'></CircularProgress></div>}
                            >

                        {dataForShow.map((datas , i)=>{
      
                            return(
                                <div className={Style.expendDiv}>
                                    
                                    <ExpendUserAc setOpenEditUser={setOpenEditUser}   targetedEditData={targetedEditData} setTargetedEditData={setTargetedEditData} setContectRefresh={setContectRefresh} datass={data} key={i}  setData={setData} data={datas} /> 
                                </div>
                            )
                        })}
                    </InfiniteScroll>
                </div>
            </div>
        </Fragment>
    )
}
export default Users;
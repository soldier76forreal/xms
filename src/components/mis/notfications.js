import Style from './notfications.module.scss'
import { Fragment , useState , useContext, useEffect  } from 'react';
import ReactDom from 'react-dom';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import WebSections from '../../contextApi/webSection';
import { useHistory } from 'react-router-dom';
import SocketContext from '../authAndConnections/socketReq';
import ToggleBtn from '../../tools/buttons/toggleBtn';
import NotficationCard from './notficationCard';
import InfiniteScroll from "react-infinite-scroll-component";
import { CircularProgress } from '@mui/material';
import NoData from '../../tools/navs/noData';
const NotficationsPortal = (props) =>{
    const authContext = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const socketCtx = useContext(SocketContext);
    const webSections = useContext(WebSections);
    const history = useHistory()
    const [notifId , setNotifId] = useState('');


    
    const [refresh , setRefresh] = useState(23);
    const [notfications , setNotfications] = useState([]);
    const [loading , setLoading] = useState({status:false , id:''});
    const [loadingPage , setLoadingPage] = useState(false);

    const [notficationsToShow , setNotficationsToShow] = useState([]);
    
    const [hasMore , setHasMore] = useState(true);
    const [limit , setLimit] = useState(10);


    const [listType , setListType] = useState('all');
    const [listSort , setListSort] = useState('all');
      const getNotfications = async() =>{
        setLoadingPage(true)
        try{
          const notifs = await authContext.jwtInst({
            method:'get',
            params:{id:jwtDecode(authContext.token).id},
            url:`${axiosGlobal.defaultTargetApi}/notfication/getNotficationBasedOnUser`,
            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        }) 
        
        var filter = [];  
        
        props.notifCount(notifs.data.filter((item)=>{return item.status === 0}).length)
        if(listType === 'all'){
            filter = notifs.data;
        }else if(listType === 'sendRequest'){
            filter = notifs.data.filter(e=>{return e.type === 'sendRequest'})
        }else if(listType === 'newInvoice'){
            filter = notifs.data.filter(e=>{return e.type === 'newInvoice'})
        }else if(listType === 'edited'){
            filter = notifs.data.filter(e=>{return e.type === 'edited'})
        }
        if(listSort === 'visited'){
            filter = notifs.data.filter((e)=>{return e.status === 1})
        }else if(listSort === 'notVisited'){
            filter = notifs.data.filter((e)=>{return e.status === 0})
        }
        
        setNotfications([...filter]);



        var temp = [];
        if(filter.length !==0){
            if(limit>filter.length){
                setLimit(filter.length);
                temp.length =0
                for(var i = 0 ; i < limit; i++){
                    if(filter[i] !== undefined){
                        temp.push(filter[i]);
                    }
                }
                setNotficationsToShow([...temp])
                setHasMore(false)
            }else if(limit<=filter.length){
                
                    setHasMore(true)
                    setLimit(limit+20);
                    temp.length =0
                    for(var j = 0 ; j < limit; j++){
                        if(filter[j] !== undefined){
                            temp.push(filter[j]);
                        }
                    }
                    setNotficationsToShow([...temp])
            }
        }
        setLoadingPage(false)
        }catch(err){
          console.log(err)
        }
      }
      useEffect(() => {
        getNotfications()
      }, [authContext.token , refresh , listSort , listType ]);
    
      useEffect(() => {       
        authContext.socket?.on("newPing", (data) => {
            setRefresh(data.ping);
        });
    }, [authContext.socket]);

    
     const notifMore = () =>{
        var temp = [];
        setTimeout(()=>{
            if(notfications.length !==0){
                if(limit>notfications.length){
                    setLimit(notfications.length);
                    temp.length =0
                    for(var i = 0 ; i < limit; i++){
                        if(notfications[i] !== undefined){
                            temp.push(notfications[i]);
                        }
                    }
                    setNotficationsToShow([...temp])
                    setHasMore(false)
                }else if(limit<=notfications.length){
                    setHasMore(true)
                    setLimit(limit+20);
                    temp.length =0
                    for(var j = 0 ; j < limit; j++){
                        if(notfications[j] !== undefined){
                            temp.push(notfications[j]);
                        }
                        
                    }
                    setNotficationsToShow([...temp])
                }
            }
        }, 1500);
      }
    
    const seen = async(id)=>{
        setLoading({status:true , id:id});
        try{
            const seen = await authContext.jwtInst({
              method:'get',
              params:{id:id},
              url:`${axiosGlobal.defaultTargetApi}/notfication/switchStatus`,
              config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
          })
            setLoading({status:false , id:id})
            setRefresh(Math.random())
          }catch(err){
            console.log(err)
          }
    }


    return(
        <Fragment>  
            <div style={props.showPost === true?{display:'block'}:{display:'none'}}  className={props.showPost===true?`${Style.mainDiv} ${Style.fadeIn}`:`${Style.mainDiv} ${Style.fadeOut}`}>
                <div className={Style.topSection}>
                    <div onClick={()=>{ props.setShowPost(false);}} className={Style.backBtn}><ArrowBackIosIcon className={Style.btn2} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                    <div className={Style.topTitle}>اعلان ها</div>
                </div>

                    <div className={Style.formDiv}  style={{maxWidth:'700px'}}>
                        <div dir='rtl' className={Style.topCountSection}>
                            <div className={Style.counter}>
                                {notfications.filter((item)=>{return item.status === 0}).length}<span> اعلان</span>
                            </div>
                        </div>
                        <div className={Style.selectBtn}>
                            <div>
                                <ToggleBtn setListType={setListType} type='type'></ToggleBtn>
                            </div>
                            <div style={{marginTop:'10px'}}>
                                <ToggleBtn setListSort={setListSort} type='sort'></ToggleBtn>
                            </div>

                        </div>
                        {loadingPage === true?
                            <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'60vh' }}>
                                <CircularProgress size='44px' color='inherit'></CircularProgress>
                            </div>
                        :loadingPage === false?
                            <div style={{padding:'20px 0px 60px 0px' , overflowY:'scroll'}}>
                                {notfications.length === 0?
                                    <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'50vh' }}>
                                        <NoData caption='اعلانی برای نمایش وجود ندارد'></NoData>
                                    </div>
                                :
                                    <InfiniteScroll
                                        dataLength={notficationsToShow.length}
                                        next={notifMore}
                                    
                                        hasMore={hasMore}
                                        loader={<div style={{display:'flex', justifyContent:'center', alignItem:'center' , marginTop:'20px'}}><CircularProgress size='35px' color='inherit'></CircularProgress></div>}
                                        >
                                        {notficationsToShow.map((data , i)=>{
                                            return(
                                                <div style={{padding:'5px 0px 5px 0px'}}>
                                                    <NotficationCard loading={loading}  seen={seen} data={data} i={i}></NotficationCard>
                                                </div>
                                            )
                                        })}
                                    </InfiniteScroll>
                                }
                            </div>

                        :null}
                    </div>
                
                <div>
                    
                </div>
            </div>
        </Fragment>
    )

}

const Notfications = (props)=>{

    return(
      <Fragment>
          {ReactDom.createPortal(
              <NotficationsPortal notifCount={props.notifCount}  setShowPost={props.setShowNotfication} showPost={props.showNotfication} ></NotficationsPortal>
          ,
            document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default Notfications;
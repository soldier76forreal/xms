import { Fragment } from 'react';
import ReactDom from 'react-dom';
import Style from './mainJobReport.module.scss'
import SearchBar from '../../tools/navs/searchModule';
import { Divider } from '@mui/material';
import ReportForm from './reportForm';
import { useState } from 'react';
import { useEffect } from 'react';
import { DateCalendar } from '@mui/x-date-pickers-pro';
import moment from 'moment';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AuthContext from '../authAndConnections/auth';
import { getSubmitedJobReports } from '../../store/store';
function categorizeDatesByMonth(year) {
    const categorizedDates = [];
  
    // Array of month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  
    // Array of day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
    // Loop through each month (0-indexed in JavaScript, so 0 represents January)
    for (let month = 0; month < 12; month++) {
      // Create a Date object for the first day of the month
      const firstDayOfMonth = new Date(year, month, 1);
  
      // Get the last day of the month
      const lastDayOfMonth = new Date(year, month + 1, 0);
  
      // Get the month name
      const monthName = monthNames[month];
  
      // Initialize an array to store objects for each day
      const monthDays = [];
  
      // Loop through each day of the month and add an object for each day
      for (let day = firstDayOfMonth.getDate(); day <= lastDayOfMonth.getDate(); day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = dayNames[currentDate.getDay()]; // Get the day of the week
  
        const dayObject = {
          dayOfWeek: dayOfWeek,
          date: currentDate
        };
  
        monthDays.push(dayObject);
      }
  
      // Create an object for the month with an array of day objects
      const monthObject = {
        month: monthName,
        days: monthDays
      };
  
      // Push the month object to the array
      categorizedDates.push(monthObject);
    }
  
    return categorizedDates;
  }

const MainJobReportPortal = (props) =>{
    const [jobReportFormView, setJobReportFormView] = useState(false)
    const [pastDaysCalenders, setPastDaysCalenders] = useState([])
    const [currentFormTitle , setCurrentFormTitle] = useState('')
    const axiosGlobal = useContext(AxiosGlobal)
    const authCtx = useContext(AuthContext)
    const dispatch = useDispatch()
    const jobReportUploadedFile = useSelector((state) => state.jobReportUploadedFile);
    const jobReportsForPerson = useSelector((state) => state.jobReportsForPerson);

    const openJobReportForm = ({date}) =>{
        setJobReportFormView(true)
        setCurrentFormTitle(date)
    }

    useEffect(() => {
        
        dispatch(getSubmitedJobReports({authCtx:authCtx , axiosGlobal:axiosGlobal}))
    }, [jobReportUploadedFile]);
    useEffect(() => {
        
        const startYear = 2023;
        const currentYear = new Date().getFullYear()
        var calenders = []
        for(var i=startYear ; i<=currentYear; i++){
            calenders.push(categorizeDatesByMonth(i))
        }
        var pastYears=[]
        for(var j = 0 ; calenders.length>j ; j++){
            var yearTemp = []
            for(var m = 0 ; calenders[j].length>m ; m++){
                var tempMonth = {month:calenders[j][m].month , days:[]}
                for(var o = 0 ; calenders[j][m].days.length > o ; o++){
                    if(moment(calenders[j][m].days[o].date).format('L') !== moment(Date.now()).format('L')){
                        tempMonth.days.push(calenders[j][m].days[o])
                    }else{
                        break
                    }
                }

                yearTemp.push(tempMonth)
            }
            pastYears.push(yearTemp.reverse())
            yearTemp = []
        }
        setPastDaysCalenders([...pastYears.reverse()])
    }, []);



    return(
        <Fragment>

            <ReportForm setCurrentFormTitle={setCurrentFormTitle} currentFormTitle={currentFormTitle} jobReportFormView={jobReportFormView} setJobReportFormView={setJobReportFormView}></ReportForm>
            <div style={{maxWidth:'700px' , height:'98vh' , padding:'0px 5px 0px 5px'}}  className={Style.ovDiv}>
                <div style={{marginTop:'6px'}} className={Style.topToolsDiv}>
                    <div className={Style.searchDiv}> 
                        <SearchBar></SearchBar>
                    </div>

                </div>
                <div style={{width:'100%', height:'100%'}}>
                    <div className={Style.todayJobReport}>
                        <div>
                            <h3>Job report</h3>
                            <div onClick={()=>{openJobReportForm({date:Date.now()})}} className={Style.cardItemForToday}>
                                <div className={Style.cardItemTodayTitle}>Today-{moment(Date.now()).format('dddd')} {moment(Date.now()).format('l')}<span>not filled</span>{moment(Date.now()).format('dddd')==='Sunday'?<span style={{background:'blue', color:'white'}}>Hollyday</span>:null}</div>
                            </div>
                        </div>
                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)' , margin:'10px 0px 10px 0px'}}></Divider>

                        {pastDaysCalenders.map((e,r)=>{
                            
                            if(r>0){
                                return(
                                    <Fragment>

                                        <div style={{fontSize:'25px', width:'100%',display:'flex',justifyContent:'center',alignItems:'center',padding:'10px 0px 10px 0px'}}>
                                            {moment(e[r].days[0].date,"DD/MM/YYYY").year()}  
                                        </div>
                                    
                                    {e.map(j=>{
                                        
                                        return(
                                            <Fragment>
                                            
                                                <div>
                                                    <ArrowRightIcon sx={{fontSize:'32px',marginLeft:'-5px'}}></ArrowRightIcon><span sx={{fontSize:'20px',marginTop:'10px'}}>{j.month}</span>
                                                </div>
                                                {j.days.reverse().map(w=>{
                                                    return(
                                                        <div onClick={()=>{openJobReportForm({date:w.date})}} style={{marginBottom:'13px'}}>
                                                            <div className={Style.cardItemForNorm}>
                                                                <div className={Style.cardItemNormTitle}>{w.dayOfWeek}-{moment(w.date).format('l')}<span>not filled</span>{w.dayOfWeek==='Sunday'?<span style={{background:'blue', color:'white'}}>Hollyday</span>:null}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </Fragment>
                                        )
                                    })}
                                    </Fragment>
                                )
                            }else if(r===0){
                                return(
                                    <Fragment>


                                    
                                    {e.map(j=>{
                                        
                                        return(
                                            <Fragment>
                                            
                                                <div>
                                                    <ArrowRightIcon sx={{fontSize:'32px',marginLeft:'-5px'}}></ArrowRightIcon><span sx={{fontSize:'20px',marginTop:'10px'}}>{j.month}</span>
                                                </div>
                                                
                                                {j.days.toReversed().map(w=>{
                                                    return(
                                                        <div onClick={()=>{openJobReportForm({date:w.date})}} style={{marginBottom:'13px'}}>
                                                            <div className={Style.cardItemForNorm}>
                                                                <div className={Style.cardItemNormTitle}>{w.dayOfWeek}-{moment(w.date).format('l')}<span>not filled</span>{w.dayOfWeek==='Sunday'?<span style={{background:'blue', color:'white'}}>Hollyday</span>:null}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </Fragment>
                                        )
                                    })}
                                    </Fragment>
                                )
                            }
                        })}

                    </div>
                </div>
            </div>
        </Fragment>
    )
}

const MainJobReport = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <MainJobReportPortal>

                </MainJobReportPortal>
                ,
                document.getElementById('jobReport')
            )}
        </Fragment>
    )
}

export default MainJobReport;
import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './pdfView.module.scss'
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MuiInput from '../../tools/inputs/muiInput';
import MuiSelect from '../../tools/inputs/muiSelect';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ReactDom from 'react-dom';
import Datep from '../../tools/inputs/datePicker';
import { Diversity1 } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useHistory } from 'react-router-dom';
import MultiSelect from '../../tools/inputs/multiSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import AddIcon from '@mui/icons-material/Add';
import NewCustomer from '../crm/newCustomer';
import CustomSelect from '../../tools/inputs/customSelect';
import { usePdf } from '@mikecousins/react-pdf';


const PdfViewPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const history = useHistory();
        // const [page, setPage] = useState(1);
        // const canvasRef = useRef(null);
        // const { pdfDocument, pdfPage } = usePdf({
        // file: props.pdfView === true?:'',
        // page,
        // canvasRef,
        // });
    return(
        <Fragment>
                <div style={props.pdfView === true?{display:'block'}:{display:'none'}}  className={props.pdfView === true? `${Style.newInvoice} ${Style.fadeIn}` : props.pdfView === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setPdfView(false); history.push('#pdfView')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>پیش فاکتور جدید</div>
                    </div>
                    <div style={{overflowY:'scroll' , height:'95vh'}}>              

                            <div style={{height:'100%'}}>
                                <embed width='100%' height='100%' src={props.thePdf}></embed>
                            </div>

                    </div>
                </div>

       </Fragment>
    )
}

const PdfView = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <PdfViewPortal thePdf={props.thePdf}  setPdfView={props.setPdfView}  pdfView={props.pdfView} ></PdfViewPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default PdfView;
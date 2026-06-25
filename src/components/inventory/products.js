
import { Fragment , useState  , useContext , useEffect} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import Style from './products.module.scss';

import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import { useHistory } from 'react-router-dom';

import ReactDom from 'react-dom';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import NewRootProduct from './newRootProduct';
import ProductAccordion from './productAccordion';
import NewSubProduct from './newSubProduct';

const ProductsPortal = (props) =>{
    const history = useHistory()
    
    const dispatch = useDispatch()
    
  





 
    

    return(
        <Fragment>
            {/* overal components */}
            <NewRootProduct></NewRootProduct>
            <NewSubProduct></NewSubProduct>
            <OpenIconSpeedDial  onClick={()=>{dispatch(actions.toggleNewRootProduct()); history.push('#newRootProduct')}}></OpenIconSpeedDial>

            <div className={Style.container}>
                <div className={Style.productAccordion}>
                    <ProductAccordion></ProductAccordion>
                </div>
            </div>

        </Fragment>
    )
}

const Products = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <ProductsPortal>
                    
                </ProductsPortal>
                ,
                document.getElementById('inventory')
                )}
        </Fragment>
    )
}
export default Products;
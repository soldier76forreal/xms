import { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchProduct, fetchVariants, actions } from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import ProductHeader from './sections/productHeader';
import SpecPanel from './sections/specPanel';
import VariantsTable from './sections/variantsTable';

const ShowProduct = ({ productId, onBack }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const product        = useSelector((s) => s.invCurrentProduct);
  const loading        = useSelector((s) => s.invCurrentProductLoading);
  const variants       = useSelector((s) => s.invVariants);
  const invRefreshKey  = useSelector((s) => s.invRefreshKey);

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProduct({ authCtx, axiosGlobal, id: productId }));
    dispatch(fetchVariants({ authCtx, axiosGlobal, productId }));
  }, [productId, invRefreshKey]);

  const handleEdit = () => {
    dispatch(actions.invSetEditProduct(product));
  };

  const handleAddVariant = () => {
    dispatch(actions.invToggleNewVariant());
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <SkeletonWrapper loading={loading} variant="card" count={1}>
        {product && (
          <>
            <ProductHeader
              product={product}
              onBack={onBack}
              onEdit={handleEdit}
              onAddVariant={handleAddVariant}
            />

            {/* Spec panel — only if product has variants with spec (show first variant's spec as sample)
                or product-level spec fields if the product has embedded spec */}
            {variants.length > 0 && variants[0]?.spec && (
              <SpecPanel
                spec={variants[0].spec}
                productCode={product.code}
              />
            )}

            <VariantsTable
              variants={variants}
              productId={product._id}
              onAddVariant={handleAddVariant}
            />
          </>
        )}
      </SkeletonWrapper>
    </Box>
  );
};

export default ShowProduct;

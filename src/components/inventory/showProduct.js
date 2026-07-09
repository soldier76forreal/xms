import { useContext, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchProduct, fetchVariants, fetchCategories, actions } from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import ProductHeader from './sections/productHeader';
import SpecPanel from './sections/specPanel';
import VariantsTable from './sections/variantsTable';
import MediaGallery from './sections/mediaGallery';
import VariantForm from './variantForm';
import ProductForm from './productForm';
import VariantDetail from './variantDetail';
import ChangeLog from './sections/changeLog';
import ProductInvoices from './sections/productInvoices';

const ShowProduct = ({ productId, onBack, fullView, onToggleFullView }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const product       = useSelector((s) => s.invCurrentProduct);
  const loading       = useSelector((s) => s.invCurrentProductLoading);
  const variants      = useSelector((s) => s.invVariants);
  const invRefreshKey = useSelector((s) => s.invRefreshKey);

  // Media managed locally — not in Redux (product-specific, short-lived)
  const [media, setMedia]             = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const fetchMedia = useCallback(async () => {
    if (!productId) return;
    setMediaLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/inventory/media`,
        params: { attachedToType: 'inventoryProduct', attachedToId: productId },
      });
      setMedia(res.data.data || []);
    } catch {
      // non-fatal
    } finally {
      setMediaLoading(false);
    }
  }, [productId, authCtx, axiosGlobal]);

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProduct({ authCtx, axiosGlobal, id: productId }));
    dispatch(fetchVariants({ authCtx, axiosGlobal, productId }));
    dispatch(fetchCategories({ authCtx, axiosGlobal }));
    fetchMedia();
  }, [productId, invRefreshKey]);

  const handleEdit = () => dispatch(actions.invSetEditProduct(product));
  const handleAddVariant = () => dispatch(actions.invToggleNewVariant());

  // Derive cover thumbnail from local media list
  const coverFile = product?.coverMediaId
    ? media.find((f) => String(f._id) === String(product.coverMediaId))
    : null;
  const coverThumbUrl = coverFile?.thumbnail
    ? `${axiosGlobal.defaultTargetApi}/uploads/${coverFile.thumbnail}`
    : null;

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
      <SkeletonWrapper loading={loading} variant="card" count={1}>
        {product && (
          <>
            <ProductHeader
              product={product}
              coverThumbUrl={coverThumbUrl}
              onBack={onBack}
              onEdit={handleEdit}
              onAddVariant={handleAddVariant}
              fullView={fullView}
              onToggleFullView={onToggleFullView}
            />

            <SpecPanel product={product} variants={variants} />

            <VariantsTable
              variants={variants}
              productId={product._id}
              onAddVariant={handleAddVariant}
            />

            <MediaGallery
              productId={product._id}
              coverMediaId={product.coverMediaId}
              media={media}
              loading={mediaLoading}
              onRefresh={fetchMedia}
            />

            <ProductInvoices productId={product._id} productCode={product.code} />

            <ChangeLog productId={product._id} />
          </>
        )}
      </SkeletonWrapper>

      <VariantForm productId={productId} />
      <ProductForm />
      <VariantDetail />
    </Box>
  );
};

export default ShowProduct;

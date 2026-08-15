import { useContext, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchProduct, fetchVariants, fetchCategories, actions } from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
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
  const errorStatus   = useSelector((s) => s.invCurrentProductErrorStatus);
  const variants      = useSelector((s) => s.invVariants);
  const invRefreshKey = useSelector((s) => s.invRefreshKey);

  // Media managed locally — not in Redux (product-specific, short-lived)
  const [media, setMedia]             = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const fetchMedia = useCallback(async (silent = false) => {
    if (!productId) return;
    if (!silent) setMediaLoading(true);
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
      if (!silent) setMediaLoading(false);
    }
  }, [productId, authCtx, axiosGlobal]);

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProduct({ authCtx, axiosGlobal, id: productId }));
    dispatch(fetchVariants({ authCtx, axiosGlobal, productId }));
    dispatch(fetchCategories({ authCtx, axiosGlobal }));
    fetchMedia();
  }, [productId, invRefreshKey]);

  // While any video is still being converted server-side (see
  // api/utils/mediaConvert.js's transcodeVideoAsync), quietly re-poll until
  // none are pending anymore, so the gallery's "Processing…" chip actually
  // clears itself instead of requiring a manual refresh.
  useEffect(() => {
    if (!media.some((f) => f.transcodeStatus === 'pending')) return;
    const timer = setTimeout(() => fetchMedia(true), 4000);
    return () => clearTimeout(timer);
  }, [media, fetchMedia]);

  const handleEdit = () => dispatch(actions.invSetEditProduct(product));
  const handleAddVariant = () => dispatch(actions.invToggleNewVariant());

  // Derive cover thumbnail from local media list
  const coverFile = product?.coverMediaId
    ? media.find((f) => String(f._id) === String(product.coverMediaId))
    : null;
  const coverThumbUrl = coverFile?.thumbnail
    ? `${axiosGlobal.defaultTargetApi}/uploads/${coverFile.thumbnail}`
    : null;

  if (!loading && errorStatus === 403) return <RestrictedAccessScreen />;

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
      {/* loading && !product (not just loading) — every media mutation
          (upload/delete/set-cover) re-dispatches fetchProduct, which toggles
          this loading flag even on an already-loaded page. Gating the
          skeleton on "loading" alone unmounted this WHOLE subtree (including
          MediaGallery) on every such refresh, wiping any local UI state
          inside it — the Inventory gallery's fullscreen mode/selection would
          silently reset the moment an upload finished. Once we have a
          product, keep the real content mounted and let it re-render with
          fresh data instead of round-tripping through the skeleton. */}
      <SkeletonWrapper loading={loading && !product} variant="card" count={1}>
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

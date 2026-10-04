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
import ProductSupply from './sections/productSupply';
import WebsitePanel from './sections/websitePanel';
import ProductPriceRequests from './sections/productPriceRequests';
import { WEBSITE_FEATURES_ENABLED } from '../../tools/featureFlags';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';

// branchReadOnly: this product belongs to a branch that merely SHARED its
// catalogue with us — everything is visible, nothing is editable, and the only
// commercial action offered is a stock request.
const ShowProduct = ({ productId, onBack, fullView, onToggleFullView, branchReadOnly = false, branchName = '' }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const product       = useSelector((s) => s.invCurrentProduct);
  const loading       = useSelector((s) => s.invCurrentProductLoading);
  const errorStatus   = useSelector((s) => s.invCurrentProductErrorStatus);
  const variants      = useSelector((s) => s.invVariants);
  const invRefreshKey = useSelector((s) => s.invRefreshKey);
  const { can }       = usePermissions();
  const { branches: ownBranches } = useBranch();

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

  // Read-only when the product belongs to a branch that only shared its
  // catalogue with us — whether we came through the branch picker or straight
  // from a link. Then nothing can be changed; otherwise a control shows only
  // with its permission key. The server checks both again on every write.
  const ownIds = (ownBranches || []).map((b) => String(b._id));
  const readOnly = branchReadOnly
    || Boolean(product && ownIds.length && !ownIds.includes(String(product.branchId)));
  const allow = (key) => !readOnly && can(key);

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
              onEdit={allow('inventory:edit') ? handleEdit : null}
              onAddVariant={allow('inventory:subproduct:create') ? handleAddVariant : null}
              fullView={fullView}
              onToggleFullView={onToggleFullView}
            />

            <SpecPanel product={product} variants={variants} />

            <VariantsTable
              variants={variants}
              productId={product._id}
              onAddVariant={allow('inventory:subproduct:create') ? handleAddVariant : null}
              allowed={{
                quantity: allow('inventory:quantity:edit'),
                price: allow('inventory:price:edit'),
                edit: allow('inventory:edit'),
                remove: allow('inventory:delete'),
              }}
            />

            <MediaGallery
              productId={product._id}
              coverMediaId={product.coverMediaId}
              media={media}
              loading={mediaLoading}
              onRefresh={fetchMedia}
              canEditMedia={allow('inventory:media:edit')}
              canSetCover={allow('inventory:edit')}
              canZip={!readOnly}
            />

            {/* hasForecast: a lot of this product is being prepared in Supply
                (forecast or final-but-unreceived on any variety) — the Request
                button then offers to reserve it before it lands. */}
            <ProductInvoices productId={product._id} productCode={product.code}
              readOnly={readOnly} branchId={product.branchId}
              branchName={branchName}
              hasForecast={(variants || []).some((v) => (Number(v.supply?.forecastQty) || 0) > 0
                || (Number(v.supply?.finalQty) || 0) > 0)} />

            <ProductSupply productId={product._id} />

            {WEBSITE_FEATURES_ENABLED && !readOnly && <WebsitePanel product={product} media={media} />}

            {WEBSITE_FEATURES_ENABLED && !readOnly && <ProductPriceRequests productId={product._id} />}

            {/* the owner's internal history — not shown to a branch it was shared with */}
            {!readOnly && <ChangeLog productId={product._id} />}
          </>
        )}
      </SkeletonWrapper>

      <VariantForm productId={productId} />
      <ProductForm />
      <VariantDetail readOnly={readOnly} />
    </Box>
  );
};

export default ShowProduct;

// css
import Style from './newSubProduct.module.scss';

// hooks
import React, { Fragment, useState, useContext } from 'react';

// mui
import {
    Grid,
    Stack,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import { ArrowBackIos, Cancel, Save, Add, Delete } from '@mui/icons-material';

// imports
import ReactDom from 'react-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useDispatch, useSelector } from 'react-redux';
import { actions, getProductsTree } from '../../store/store';

const NewSubProductPortal = () => {
    const axiosCtx = useContext(AxiosGlobal);
    const authCtx = useContext(AuthContext);
    const MySwal = withReactContent(Swal);
    const dispatch = useDispatch();

    const newSubProduct = useSelector((state) => state.newSubProduct);
    const selectedRootProduct = useSelector((state) => state.selectedRootProduct); // this returns id

    // ------------------ STATE ------------------
    const [quantityAndPrice, setQuantityAndPrice] = useState([
        {
            quantity: '',
            scale: null,
            from: null,
            price: { sector: '', wholesale: '', bulk: '', currency: null }
        }
    ]);

    const [dimensions, setDimensions] = useState({ width: '', height: '', thickness: '' });
    const [quality, setQuality] = useState(null);
    const [loading, setLoading] = useState(false);

    // ------------------ OPTIONS ------------------
    const scaleOptions = [
        { label: 'Piece', id: 'PCS' },
        { label: 'Meter', id: 'M' },
        { label: 'Square Meter', id: 'M2' },
        { label: 'Cubic Meter', id: 'M3' },
        { label: 'Kilogram', id: 'KG' },
        { label: 'Ton', id: 'TON' },
        { label: 'Liter', id: 'L' },
        { label: 'Set', id: 'SET' },
        { label: 'Box', id: 'BOX' },
        { label: 'Roll', id: 'ROLL' }
    ];

    const fromOptions = [
        { label: 'Factory', id: 'FACTORY' },
        { label: 'Warehouse', id: 'WAREHOUSE' },
        { label: 'Supplier', id: 'SUPPLIER' }
    ];

    const currencyOptions = [
        { label: 'US Dollar (USD)', id: 'USD' },
        { label: 'Euro (EUR)', id: 'EUR' },
        { label: 'UAE Dirham (AED)', id: 'AED' },
        { label: 'Saudi Riyal (SAR)', id: 'SAR' },
        { label: 'Qatari Riyal (QAR)', id: 'QAR' },
        { label: 'Kuwaiti Dinar (KWD)', id: 'KWD' },
        { label: 'Bahraini Dinar (BHD)', id: 'BHD' },
        { label: 'Omani Rial (OMR)', id: 'OMR' },
        { label: 'Jordanian Dinar (JOD)', id: 'JOD' },
        { label: 'Iraqi Dinar (IQD)', id: 'IQD' },
        { label: 'Lebanese Pound (LBP)', id: 'LBP' },
        { label: 'Syrian Pound (SYP)', id: 'SYP' },
        { label: 'Egyptian Pound (EGP)', id: 'EGP' },
        { label: 'Turkish Lira (TRY)', id: 'TRY' },
        { label: 'Iranian Rial (IRR)', id: 'IRR' },
        { label: 'Yemeni Rial (YER)', id: 'YER' }
    ];

    const qualityOp = [
        { label: 'Grade 1', id: 'Q' },
        { label: 'Grade 2', id: 'W' },
        { label: 'Grade 3', id: 'E' },
        { label: 'Grade 4', id: 'R' },
        { label: 'Grade 5', id: 'T' },
        { label: 'Grade 6', id: 'Y' }
    ];

    // ------------------ HELPERS ------------------
    const updateQuantityRow = (index, field, value) => {
        setQuantityAndPrice(prev => {
            const copy = [...prev];
            copy[index][field] = value;
            return copy;
        });
    };

    const updatePriceField = (index, field, value) => {
        setQuantityAndPrice(prev => {
            const copy = [...prev];
            copy[index].price[field] = value;
            return copy;
        });
    };

    const addQuantityRow = () => {
        setQuantityAndPrice(prev => [
            ...prev,
            {
                quantity: '',
                scale: null,
                from: null,
                price: { sector: '', wholesale: '', bulk: '', currency: null }
            }
        ]);
    };

    const removeQuantityRow = (index) => {
        if (quantityAndPrice.length === 1) return;
        setQuantityAndPrice(prev => prev.filter((_, i) => i !== index));
    };

    // ------------------ SUBMIT ------------------
    const submitSubProduct = async () => {
        try {
            if (!selectedRootProduct) return MySwal.fire("Error", "No root product selected", "error");
            if (!quality?.id) return MySwal.fire("Error", "Quality is required", "warning");

            if (!dimensions.width || !dimensions.height || !dimensions.thickness) {
                return MySwal.fire("Error", "Dimensions are required", "warning");
            }

            setLoading(true);

            const payload = {
                parentId: selectedRootProduct, // ⚡ use parentId
                quality: quality.id,
                dimensions: {
                    width: Number(dimensions.width),
                    height: Number(dimensions.height),
                    thickness: Number(dimensions.thickness)
                },
                quantityAndPrice: quantityAndPrice.map(q => ({
                    quantity: Number(q.quantity),
                    scale: q.scale?.id,
                    from: q.from?.id,
                    price: {
                        sector: Number(q.price.sector),
                        wholesale: Number(q.price.wholesale),
                        bulk: Number(q.price.bulk),
                        currency: q.price.currency?.id
                    }
                }))
            };

            await authCtx.jwtInst({
                method: "post",
                url: `${axiosCtx.defaultTargetApi}/inventory/products/sub`,
                data: payload
            });

            MySwal.fire({
                icon: "success",
                title: "Success",
                text: "Sub product created successfully",
                timer: 2000,
                showConfirmButton: false
            });

            dispatch(getProductsTree({ authCtx, axiosCtx }));
            dispatch(actions.toggleNewSubProduct());

        } catch (err) {
            console.error(err);
            MySwal.fire("Error", err.response?.data?.message || "Failed to create sub product", "error");
        } finally {
            setLoading(false);
        }
    };

    // ------------------ RENDER ------------------
    return (
        <Fragment>
            <div
                style={{ display: newSubProduct ? 'block' : 'none' }}
                className={`${Style.newInvoice} ${newSubProduct ? Style.fadeIn : Style.fadeOut}`}
            >
                {/* TOP */}
                <div className={Style.topSection}>
                    <div
                        onClick={() => dispatch(actions.toggleNewSubProduct())}
                        className={Style.backBtn}
                    >
                        <ArrowBackIos sx={{ color: '#000', fontSize: '30px' }} />
                    </div>
                    <div className={Style.topTitle}>New Sub Product</div>
                </div>

                {/* BODY */}
                <div className={Style.ovDiv} style={{ maxWidth: '1680px', height: '95vh', overflowY: 'scroll', padding: "0px 15px 60px" }}>
                    <h4>Quantity and Price</h4>

                    {quantityAndPrice.map((row, index) => (
                        <Fragment key={index}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Quantity"
                                        variant="filled"
                                        value={row.quantity}
                                        onChange={(e) => updateQuantityRow(index, 'quantity', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12} md={1}>
                                    <Autocomplete
                                        disablePortal
                                        options={scaleOptions}
                                        value={row.scale}
                                        getOptionLabel={(option) => option.label}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                        onChange={(e, value) => updateQuantityRow(index, 'scale', value)}
                                        renderInput={(params) => <TextField {...params} label="Scale" variant="filled" />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <Autocomplete
                                        disablePortal
                                        options={fromOptions}
                                        value={row.from}
                                        getOptionLabel={(option) => option.label}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                        onChange={(e, value) => updateQuantityRow(index, 'from', value)}
                                        renderInput={(params) => <TextField {...params} label="From" variant="filled" />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Sector Price"
                                        variant="filled"
                                        value={row.price.sector}
                                        onChange={(e) => updatePriceField(index, 'sector', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Wholesale Price"
                                        variant="filled"
                                        value={row.price.wholesale}
                                        onChange={(e) => updatePriceField(index, 'wholesale', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Bulk Price"
                                        variant="filled"
                                        value={row.price.bulk}
                                        onChange={(e) => updatePriceField(index, 'bulk', e.target.value)}
                                    />
                                </Grid>

                                <Grid item xs={12} md={1}>
                                    <Autocomplete
                                        disablePortal
                                        options={currencyOptions}
                                        value={row.price.currency}
                                        getOptionLabel={(option) => option.label}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                        onChange={(e, value) => updatePriceField(index, 'currency', value)}
                                        renderInput={(params) => <TextField {...params} label="Currency" variant="filled" />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={1}>
                                    <Button
                                        color="error"
                                        variant="outlined"
                                        disabled={quantityAndPrice.length === 1}
                                        onClick={() => removeQuantityRow(index)}
                                    >
                                        <Delete />
                                    </Button>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1 }} />
                        </Fragment>
                    ))}

                    <Button variant="outlined" startIcon={<Add />} onClick={addQuantityRow}>
                        Add Quantity & Price
                    </Button>

                    <Divider sx={{ my: 2 }} />

                    <h4>Dimension</h4>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Width"
                                variant="filled"
                                value={dimensions.width}
                                onChange={(e) => setDimensions(p => ({ ...p, width: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Height"
                                variant="filled"
                                value={dimensions.height}
                                onChange={(e) => setDimensions(p => ({ ...p, height: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Thickness"
                                variant="filled"
                                value={dimensions.thickness}
                                onChange={(e) => setDimensions(p => ({ ...p, thickness: e.target.value }))}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <h4>Quality</h4>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                disablePortal
                                options={qualityOp}
                                value={quality}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(e, value) => setQuality(value)}
                                renderInput={(params) => <TextField {...params} label="Quality" variant="filled" />}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Stack direction="row" spacing={2}>
                        <Button variant="outlined" startIcon={<Cancel />} disabled={loading}
                            onClick={() => dispatch(actions.toggleNewSubProduct())}>
                            Cancel
                        </Button>

                        <Button variant="contained"
                            endIcon={loading ? <CircularProgress size={18} /> : <Save />}
                            disabled={loading}
                            onClick={submitSubProduct}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </Stack>
                </div>
            </div>
        </Fragment>
    );
};

const NewSubProduct = () => (
    <Fragment>
        {ReactDom.createPortal(
            <NewSubProductPortal />,
            document.getElementById('newRootProduct')
        )}
    </Fragment>
);

export default NewSubProduct;

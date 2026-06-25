// css
import Style from './newRootProduct.module.css';

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
import { ArrowBackIos, Cancel, Save } from '@mui/icons-material';

// imports
import ReactDom from 'react-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';

const NewRootProductPortal = () => {
    const axiosCtx = useContext(AxiosGlobal);
    const authCtx = useContext(AuthContext);
    const MySwal = withReactContent(Swal);
    const dispatch = useDispatch();

    const newRootProduct = useSelector((state) => state.newRootProduct);

    // ------------------ STATE ------------------
    const [form, setForm] = useState({
        productType: null,
        code: "",
        name: {
            fa: "",
            ar: "",
            en: "",
            mine: ""
        }
    });

    const [errors, setErrors] = useState({
        productType: false,
        code: false,
        en: false
    });

    const [loading, setLoading] = useState(false);

    // ------------------ OPTIONS ------------------
    const productsOp = [
        { label: 'Travertine', id: 'TR' },
        { label: 'Marble', id: 'MA' },
        { label: 'Granite', id: 'GR' }
    ];

    // ------------------ SUBMIT ------------------
    const submitRootProduct = async () => {
        const validationErrors = {
            // productType: !form.productType,
            code: form.code.trim() === "",
            en: form.name.en.trim() === ""
        };

        setErrors(validationErrors);

        if (Object.values(validationErrors).some(Boolean)) {
            MySwal.fire({
                icon: "warning",
                title: "Missing required fields",
                text: "Product, Code and English name are required"
            });
            return;
        }

        try {
            setLoading(true);

            const finalCode = `${form.productType.id}${form.code}`;

            await authCtx.jwtInst({
                method: "post",
                url: `${axiosCtx.defaultTargetApi}/inventory/products/root`,
                data: {
                    code: finalCode,
                    name: form.name
                }
            });

            MySwal.fire({
                icon: "success",
                title: "Success",
                text: "Root product created successfully",
                timer: 2000,
                showConfirmButton: false
            });

            setForm({
                productType: null,
                code: "",
                name: { fa: "", ar: "", en: "", mine: "" }
            });

            setErrors({ productType: false, code: false, en: false });

            dispatch(actions.toggleNewRootProduct());

        } catch (err) {
            console.error(err);
            MySwal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Failed to create product"
            });
        } finally {
            setLoading(false);
        }
    };

    // ------------------ RENDER ------------------
    return (
        <Fragment>
            <div
                style={{ display: newRootProduct ? 'block' : 'none' }}
                className={`${Style.newInvoice} ${newRootProduct ? Style.fadeIn : Style.fadeOut}`}
            >
                {/* TOP */}
                <div className={Style.topSection}>
                    <div
                        onClick={() => dispatch(actions.toggleNewRootProduct())}
                        className={Style.backBtn}
                    >
                        <ArrowBackIos sx={{ color: '#000', fontSize: '30px' }} />
                    </div>
                    <div className={Style.topTitle}>New Product</div>
                </div>

                {/* BODY */}
                <div
                    className={Style.ovDiv}
                    style={{
                        maxWidth: '1680px',
                        height: '95vh',
                        overflowY: 'scroll',
                        padding: "0px 15px 60px"
                    }}
                >
                    {/* PRODUCT CODE */}
                    <h4>Product Code</h4>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                disablePortal
                                options={productsOp}
                                value={form.productType}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(e, value) => {
                                    setForm(prev => ({ ...prev, productType: value }));
                                    setErrors(prev => ({ ...prev, productType: false }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Product"
                                        variant="filled"
                                        error={errors.productType}
                                        helperText={errors.productType ? "Required" : ""}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Code"
                                variant="filled"
                                value={form.code}
                                error={errors.code}
                                helperText={errors.code ? "Required" : ""}
                                onChange={(e) => {
                                    setForm(prev => ({
                                        ...prev,
                                        code: e.target.value.toUpperCase()
                                    }));
                                    setErrors(prev => ({ ...prev, code: false }));
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* NAMES */}
                    <h4>Name</h4>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Farsi name"
                                variant="filled"
                                value={form.name.fa}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        name: { ...prev.name, fa: e.target.value }
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Arabic name"
                                variant="filled"
                                value={form.name.ar}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        name: { ...prev.name, ar: e.target.value }
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="English name"
                                variant="filled"
                                value={form.name.en}
                                error={errors.en}
                                helperText={errors.en ? "Required" : ""}
                                onChange={(e) => {
                                    setForm(prev => ({
                                        ...prev,
                                        name: { ...prev.name, en: e.target.value }
                                    }));
                                    setErrors(prev => ({ ...prev, en: false }));
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Mine name"
                                variant="filled"
                                value={form.name.mine}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        name: { ...prev.name, mine: e.target.value }
                                    }))
                                }
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* ACTIONS */}
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            disabled={loading}
                            onClick={() => dispatch(actions.toggleNewRootProduct())}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            endIcon={
                                loading
                                    ? <CircularProgress size={18} color="inherit" />
                                    : <Save />
                            }
                            disabled={loading}
                            onClick={submitRootProduct}
                        >
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </Stack>
                </div>
            </div>
        </Fragment>
    );
};

const NewRootProduct = () => (
    <Fragment>
        {ReactDom.createPortal(
            <NewRootProductPortal />,
            document.getElementById('newRootProduct')
        )}
    </Fragment>
);

export default NewRootProduct;

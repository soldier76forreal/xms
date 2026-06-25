import * as React from 'react';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add, PersonAdd } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EnhancedTable from './table';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import { useHistory } from 'react-router-dom';

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': { borderBottom: 0 },
  '&::before': { display: 'none' },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
    { transform: 'rotate(90deg)' },
  [`& .${accordionSummaryClasses.content}`]: {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export default function ProductAccordion() {
  const dispatch = useDispatch();
  const history = useHistory();

  const { productsTree, productLoading, productError } = useSelector(
    (state) => state
  );
  const productRoots = Array.isArray(productsTree) ? productsTree : [];

  const [expanded, setExpanded] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
    dispatch(actions.setSelectedRootProduct(newExpanded ? panel : null));
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    // dispatch(actions.setSelectedRootProduct(expanded));
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ---------------- LOADING / ERROR ----------------
  if (productLoading) {
    return <CircularProgress />;
  }

  if (productError) {
    return <Alert severity="error">{productError}</Alert>;
  }

  // ---------------- RENDER ----------------
  return (
    <div>
      {productRoots.map((root) => (
        <Accordion
          key={root._id}
          expanded={expanded === root._id}
          onChange={handleChange(root._id)}
        >
          {/* SUMMARY */}
          <AccordionSummary >
            <div style={{ display: 'flex', width: '100%' }}>
              <Chip
                label={root.code}
                sx={{
                  fontWeight: 600,
                  fontSize: '15px',
                  backgroundColor: 'rgb(240, 159, 159)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between',
                  marginLeft: 8,
                }}
              >
                <span style={{ fontFamily: 'roboto' }}>
                  {root.names?.en || '—'}
                </span>

                <IconButton onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
              </div>
            </div>
          </AccordionSummary>

          {/* DETAILS */}
          <AccordionDetails>
            <Button
              variant="contained"
              endIcon={<Add />}
              onClick={() => {
                dispatch(actions.toggleNewSubProduct());
                history.push('#newSubProduct');
              }}
            >
              Add sub product
            </Button>

            <Divider sx={{ my: 2 }} />

            <EnhancedTable rows={root.children || []} />
          </AccordionDetails>
        </Accordion>
      ))}

      {/* MENU */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Edit product
        </MenuItem>
      </Menu>
    </div>
  );
}

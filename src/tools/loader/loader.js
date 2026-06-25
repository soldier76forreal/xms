import { useTheme } from '@mui/material/styles';
import Lottie from 'lottie-react';
import xLoadingWhite from '../../assets/white.json';
import xLoadingBlack from '../../assets/xcapitalLoading.json';

const Loader = (props) => {
  const theme = useTheme();

  // explicit color prop wins; fallback to current theme mode
  const useDark = props.color
    ? props.color === 'black'
    : theme.palette.mode === 'light';

  return (
    <Lottie
      style={{ width: props.width ?? 80 }}
      animationData={useDark ? xLoadingBlack : xLoadingWhite}
      loop
    />
  );
};

export default Loader;

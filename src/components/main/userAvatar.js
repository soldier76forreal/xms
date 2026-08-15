import { useContext } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '@mui/material/Avatar';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Shared avatar-by-id — resolves against the app-wide userDirectory (fetched
// once on login, see store.js's fetchUserDirectory) so any component that
// only has a userId (activity actorId, task assignee, chat senderId, "shared
// by"...) can show the real profile photo instead of initials/a generic icon.
// Falls back to initials, then to MUI Avatar's own default person glyph.
export default function UserAvatar({ userId, size = 24, fontSize, sx }) {
  const axiosGlobal = useContext(AxiosGlobal);
  const entry = useSelector((s) => (userId ? s.userDirectory[userId] : null));

  const photoPath = entry?.profileImage?.thumbnail || entry?.profileImage?.url || null;
  const src = photoPath ? `${axiosGlobal.defaultTargetApi}${photoPath}` : undefined;
  const initials = entry
    ? (((entry.firstName || '')[0] || '') + ((entry.lastName || '')[0] || ''))
    : '';

  return (
    <Avatar src={src} alt=""
      sx={{ width: size, height: size, fontSize: fontSize || Math.max(10, size * 0.42), ...sx }}>
      {!src ? (initials || null) : null}
    </Avatar>
  );
}

import { useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import './UserAvatar.css';

export default function UserAvatar({ user, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const src      = user?.user_avatar;
  const username = user?.first_name ?? user?.user_name ?? null;

  return (
    <div className="user-avatar-wrap">
      {src && !failed ? (
        <img
          className="user-avatar-img"
          src={src}
          alt={username ?? ''}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        />
      ) : (
        <FaUserCircle size={size} color="#333" style={{ flexShrink: 0 }} />
      )}
      {username && (
        <span className="user-avatar-name">{username.toUpperCase()}</span>
      )}
    </div>
  );
}

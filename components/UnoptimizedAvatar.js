import Image from 'next/image';
import { useState, useEffect } from 'react';

/**
 * An avatar component that loads images from the local /public/avatars folder.
 * It handles loading errors by showing a fallback image if the avatar was not
 * successfully downloaded during the build process.
 */
const UnoptimizedAvatar = (props) => {
  const { playerName, ...rest } = props; // We now pass playerName instead of a full src
  
  const fallbackSrc = '/avatars/default-avatar.png'; // Make sure this file exists!
  
  // Construct the local path to the avatar
  const localAvatarSrc = `/avatars/${playerName}.png`;

  const [imageSrc, setImageSrc] = useState(localAvatarSrc);

  useEffect(() => {
    setImageSrc(localAvatarSrc);
  }, [localAvatarSrc]);

  return (
    <Image
      key={imageSrc}
      {...rest} // Pass down alt, width, height, className
      src={imageSrc}
      unoptimized
      onError={() => {
        setImageSrc(fallbackSrc);
      }}
    />
  );
};

export default UnoptimizedAvatar;
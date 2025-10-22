import React from 'react';

interface AlbumCoverProps {
  r2Key: string | null | undefined;
  playlistName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

export const AlbumCover: React.FC<AlbumCoverProps> = ({
  r2Key,
  playlistName,
  size = 'md',
  className = '',
  fallbackIcon
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (!r2Key) {
      setImageUrl(null);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        // Use client-side API call to get signed URL
        const response = await fetch('/api/r2/sign-get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: r2Key }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        
        const { url } = await response.json();
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to load album cover:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [r2Key]);

  if (!r2Key || hasError) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center`}>
        {fallbackIcon || (
          <svg 
            className="w-6 h-6 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
            />
          </svg>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-800 rounded-lg flex items-center justify-center animate-pulse`}>
        <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl || undefined}
      alt={`Album cover for ${playlistName}`}
      className={`${sizeClasses[size]} ${className} rounded-lg object-cover shadow-lg`}
      onError={() => setHasError(true)}
    />
  );
};

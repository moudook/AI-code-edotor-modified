import React, { useMemo } from 'react';

interface LivePreviewProps {
  htmlCode: string;
  cssCode: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ htmlCode, cssCode }) => {
  const srcDoc = useMemo(() => {
    return `
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>${htmlCode}</body>
      </html>
    `;
  }, [htmlCode, cssCode]);

  return (
    <iframe
      srcDoc={srcDoc}
      title="Live Preview"
      sandbox="allow-same-origin"
      className="w-full h-full bg-white border-none"
    />
  );
};

export default React.memo(LivePreview);

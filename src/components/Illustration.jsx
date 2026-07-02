import { useState } from "react";

export default function Illustration({ src, fallback, alt = "", className }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <span className={className} role="img" aria-label={alt || undefined}>
        {fallback}
      </span>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setErrored(true)} />;
}

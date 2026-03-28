import { useState, useEffect } from "react";

/**
 * Hook to determine responsive logo size based on screen width
 * Returns: "sm" (32px) for mobile, "md" (48px) for tablet+
 */
const useResponsiveLogoSize = () => {
  const [logoSize, setLogoSize] = useState("md");

  useEffect(() => {
    const handleResize = () => {
      // Mobile: < 640px (xs, sm)
      // Tablet: 640px - 1024px (md, lg)
      // Desktop: > 1024px (xl, 2xl)
      if (window.innerWidth < 640) {
        setLogoSize("sm");
      } else {
        setLogoSize("md");
      }
    };

    // Set initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return logoSize;
};

export default useResponsiveLogoSize;

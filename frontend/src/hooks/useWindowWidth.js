import { useState, useEffect } from 'react';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

// Returnează lățimea "efectivă" a ferestrei. Pe touch-uri (telefon/tabletă) e identică cu
// `window.innerWidth`. Pe desktop/laptop returnează minim 1280 ca să nu trigereze
// vreun threshold de layout mobil (vezi `src/utils/devicePatch.js`).
export const useWindowWidth = () => {
    const [width, setWidth] = useState(() => getEffectiveViewportWidth());

    useEffect(() => {
        const handleResize = () => setWidth(getEffectiveViewportWidth());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width;
};

import { useState, useEffect } from 'react';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

// Returnează lățimea reală a ferestrei (`window.innerWidth`), pe orice dispozitiv.
// Layout-ul comută pe baza lățimii, la fel ca regulile CSS responsive
// (vezi `src/utils/devicePatch.js`).
export const useWindowWidth = () => {
    const [width, setWidth] = useState(() => getEffectiveViewportWidth());

    useEffect(() => {
        const handleResize = () => setWidth(getEffectiveViewportWidth());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width;
};

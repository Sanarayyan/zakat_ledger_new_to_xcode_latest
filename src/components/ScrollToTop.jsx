import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset scroll position to top whenever the pathname changes
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant', // Use 'instant' to avoid jarring scroll animations on mobile route transitions
        });
    }, [pathname]);

    return null;
}

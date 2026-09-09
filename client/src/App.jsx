import Metadata from './seo/Metadata';
import PageLayout from './components/Layout/PageLayout';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';

import WatchPage from './pages/WatchPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import RefundPage from './pages/RefundPage.jsx';

export function AppRoutes() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

    return (
        <>
            <Metadata />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/watch" element={<WatchPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/terms-and-conditions" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
                <Route path="*" element={<PageLayout title="Page not found" description="This page does not exist."><a href="/watch">Start or join a watch party</a></PageLayout>} />
            </Routes>
        </>
    );
}

function App() { return <BrowserRouter><AppRoutes /></BrowserRouter>; }
export default App;

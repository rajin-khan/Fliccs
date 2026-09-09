import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

export default function SiteHeader() {
    return (
        <header className="site-header">
            <Link to="/" aria-label="Fliccs home"><BrandLogo size="md" /></Link>
            <span className="text-white/50 text-[10px] tracking-[0.2em] font-light leading-none" aria-label="Version 3.0">V3.0</span>
        </header>
    );
}

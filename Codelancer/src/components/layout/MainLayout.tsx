import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;

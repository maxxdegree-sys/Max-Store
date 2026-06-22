import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import { LocationProvider } from '../../context/LocationContext';
import LocationPicker from '../location/LocationPicker';

export default function Layout() {
  return (
    <LocationProvider>
      <div className="flex min-h-screen flex-col bg-white dark:bg-ink-900">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
        <LocationPicker />
      </div>
    </LocationProvider>
  );
}

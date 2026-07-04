import Layout from "./Layout.jsx";

import AdminBloggers from "./AdminBloggers";

import AdminCampaigns from "./AdminCampaigns";

import AdminDashboard from "./AdminDashboard";

import AdminLooks from "./AdminLooks";

import AdminOrders from "./AdminOrders";

import AdminPayouts from "./AdminPayouts";

import AdminProducts from "./AdminProducts";

import AdminPromoCodes from "./AdminPromoCodes";

import AdminSellers from "./AdminSellers";

import AdminSettings from "./AdminSettings";

import AdminUsers from "./AdminUsers";

import BloggerDashboard from "./BloggerDashboard";

import BloggerProfile from "./BloggerProfile";

import Cart from "./Cart";

import Checkout from "./Checkout";

import Home from "./Home";

import LookDetail from "./LookDetail";

import Looks from "./Looks";

import OrderSuccess from "./OrderSuccess";

import Orders from "./Orders";

import ProductDetail from "./ProductDetail";

import ProductList from "./ProductList";

import Profile from "./Profile";

import Search from "./Search";

import SellerCampaigns from "./SellerCampaigns";

import SellerDashboard from "./SellerDashboard";

import SellerInvitation from "./SellerInvitation";

import SellerLooks from "./SellerLooks";

import SellerOrders from "./SellerOrders";

import SellerProducts from "./SellerProducts";

import SellerProfile from "./SellerProfile";

import SellerSignup from "./SellerSignup";

import Wishlist from "./Wishlist";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AdminBloggers: AdminBloggers,
    
    AdminCampaigns: AdminCampaigns,
    
    AdminDashboard: AdminDashboard,
    
    AdminLooks: AdminLooks,
    
    AdminOrders: AdminOrders,
    
    AdminPayouts: AdminPayouts,
    
    AdminProducts: AdminProducts,
    
    AdminPromoCodes: AdminPromoCodes,
    
    AdminSellers: AdminSellers,
    
    AdminSettings: AdminSettings,
    
    AdminUsers: AdminUsers,
    
    BloggerDashboard: BloggerDashboard,
    
    BloggerProfile: BloggerProfile,
    
    Cart: Cart,
    
    Checkout: Checkout,
    
    Home: Home,
    
    LookDetail: LookDetail,
    
    Looks: Looks,
    
    OrderSuccess: OrderSuccess,
    
    Orders: Orders,
    
    ProductDetail: ProductDetail,
    
    ProductList: ProductList,
    
    Profile: Profile,
    
    Search: Search,
    
    SellerCampaigns: SellerCampaigns,
    
    SellerDashboard: SellerDashboard,
    
    SellerInvitation: SellerInvitation,
    
    SellerLooks: SellerLooks,
    
    SellerOrders: SellerOrders,
    
    SellerProducts: SellerProducts,
    
    SellerProfile: SellerProfile,
    
    SellerSignup: SellerSignup,
    
    Wishlist: Wishlist,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AdminBloggers />} />
                
                
                <Route path="/AdminBloggers" element={<AdminBloggers />} />
                
                <Route path="/AdminCampaigns" element={<AdminCampaigns />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminLooks" element={<AdminLooks />} />
                
                <Route path="/AdminOrders" element={<AdminOrders />} />
                
                <Route path="/AdminPayouts" element={<AdminPayouts />} />
                
                <Route path="/AdminProducts" element={<AdminProducts />} />
                
                <Route path="/AdminPromoCodes" element={<AdminPromoCodes />} />
                
                <Route path="/AdminSellers" element={<AdminSellers />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/BloggerDashboard" element={<BloggerDashboard />} />
                
                <Route path="/BloggerProfile" element={<BloggerProfile />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/Checkout" element={<Checkout />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/LookDetail" element={<LookDetail />} />
                
                <Route path="/Looks" element={<Looks />} />
                
                <Route path="/OrderSuccess" element={<OrderSuccess />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/ProductDetail" element={<ProductDetail />} />
                
                <Route path="/ProductList" element={<ProductList />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Search" element={<Search />} />
                
                <Route path="/SellerCampaigns" element={<SellerCampaigns />} />
                
                <Route path="/SellerDashboard" element={<SellerDashboard />} />
                
                <Route path="/SellerInvitation" element={<SellerInvitation />} />
                
                <Route path="/SellerLooks" element={<SellerLooks />} />
                
                <Route path="/SellerOrders" element={<SellerOrders />} />
                
                <Route path="/SellerProducts" element={<SellerProducts />} />
                
                <Route path="/SellerProfile" element={<SellerProfile />} />
                
                <Route path="/SellerSignup" element={<SellerSignup />} />
                
                <Route path="/Wishlist" element={<Wishlist />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
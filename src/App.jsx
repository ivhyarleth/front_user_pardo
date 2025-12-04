import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { PedidosProvider, usePedidos } from './context/PedidosContext';
import Header from './components/Header';
import CartSidebar from './components/CartSidebar';
import AddToCartToast from './components/AddToCartToast';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import MisPedidos from './pages/MisPedidos';
import Orden from './pages/Orden';
import OrdenDetalle from './pages/OrdenDetalle';
import { logoutAPI, isAuthenticated } from './config/api';

// Componente para cargar pedidos cuando el usuario se autentica
const PedidosLoader = ({ user }) => {
  const { cargarPedidos, pedidos, loading } = usePedidos();
  const location = useLocation();
  const [lastUserId, setLastUserId] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const currentUserId = user?.user_id;
    
    // Si el usuario cambió (login o cambio de usuario), cargar pedidos
    if (user && currentUserId && currentUserId !== lastUserId && isAuthenticated()) {
      setLastUserId(currentUserId);
      setHasLoadedOnce(true);
      cargarPedidos();
      return;
    }

    // Si navegamos a una ruta que necesita pedidos y aún no se han cargado
    if (user && isAuthenticated() && !hasLoadedOnce && !loading && pedidos.length === 0) {
      const needsPedidos = location.pathname === '/home' || location.pathname === '/mis-pedidos' || location.pathname.startsWith('/orden');
      if (needsPedidos) {
        setHasLoadedOnce(true);
        cargarPedidos();
      }
    }
  }, [user, location.pathname, cargarPedidos, lastUserId, hasLoadedOnce, pedidos.length, loading]);

  return null;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('pardos-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pardos-user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      // Llamar al backend para cerrar sesión
      await logoutAPI();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Continuar con la limpieza local aunque falle el backend
    } finally {
      // Limpiar estado local
      setUser(null);
      localStorage.removeItem('pardos-user');
      localStorage.removeItem('pardos-auth-token');
      localStorage.removeItem('pardos-cart');
      localStorage.removeItem('pardos-pedidos');
      localStorage.removeItem('pardos-sede-selected');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  };

  return (
    <Router>
      <PedidosProvider>
        <CartProvider>
          <div className="min-h-screen bg-pardos-cream">
            {user && <Header user={user} onLogout={handleLogout} />}
            {user && <PedidosLoader user={user} />}
            <CartSidebar />
            <AddToCartToast />
            
            <Routes>
              <Route 
                path="/" 
                element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/login" 
                element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/home" />} 
              />
              <Route 
                path="/register" 
                element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/home" />} 
              />
              <Route 
                path="/home" 
                element={user ? <Home /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/menu" 
                element={user ? <Menu /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/checkout" 
                element={user ? <Checkout /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/mis-pedidos" 
                element={user ? <MisPedidos /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/orden" 
                element={user ? <Orden /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/orden/:pedidoId" 
                element={user ? <OrdenDetalle /> : <Navigate to="/login" />} 
              />
            </Routes>
          </div>
        </CartProvider>
      </PedidosProvider>
    </Router>
  );
}

export default App;

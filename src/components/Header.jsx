import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = ({ user, onLogout }) => {
  const { getCartCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleLogoClick = () => {
    navigate('/home');
  };

  return (
    <header className="bg-black text-white sticky top-0 z-50 shadow-lg">
      <div className="w-full px-6 lg:px-10 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Brand Name */}
          <div
            onClick={handleLogoClick}
            className="flex items-center space-x-4 cursor-pointer"
          >
            <div className="w-16 h-16 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-lg">
              <img
                src="https://images-frontent-user-pardos.s3.us-east-1.amazonaws.com/logo_pardos_blanco.jpg"
                alt="Logo Pardos Chicken"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="font-spartan font-bold text-xl tracking-wide">
              PARDOS CHICKEN
            </h1>
          </div>

          {/* Center Navigation */}
          <nav className="flex items-center space-x-12">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `font-spartan font-semibold text-lg transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white hover:text-pardos-yellow'
                }`
              }
            >
              SEDE
            </NavLink>

            <NavLink
              to="/menu"
              className={({ isActive }) =>
                `font-spartan font-semibold text-lg transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white hover:text-pardos-yellow'
                }`
              }
            >
              NUESTRA CARTA
            </NavLink>

            <NavLink
              to="/mis-pedidos"
              className={({ isActive }) =>
                `font-spartan font-semibold text-lg transition-colors ${
                  isActive
                    ? 'text-pardos-yellow'
                    : 'text-white hover:text-pardos-yellow'
                }`
              }
            >
              MIS PEDIDOS
            </NavLink>
          </nav>

          {/* Right Side - Cart + User */}
          <div className="flex items-center space-x-6">
            {/* MI ORDEN Button with Cart Icon */}
            <button
              onClick={handleCartClick}
              className="flex items-center space-x-2 hover:text-pardos-yellow transition-colors"
            >
              <span className="font-spartan font-semibold text-lg">MI ORDEN</span>
              <div className="relative">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pardos-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </div>
            </button>

            {user ? (
            <div className="flex flex-col items-end space-y-1 justify-center">
              {/* User Greeting */}
              <span className="font-lato text-base">
                Hola, <span className="font-semibold">{user.nombre}</span>
              </span>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="bg-pardos-purple hover:bg-pardos-brown text-white px-4 py-1 rounded-full font-spartan font-semibold text-sm transition-colors"
              >
                Cerrar sesión
              </button>
            </div>

            ) : (
              <Link
                to="/login"
                className="bg-pardos-purple hover:bg-pardos-brown text-white px-6 py-2 rounded-full font-spartan font-semibold text-sm transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

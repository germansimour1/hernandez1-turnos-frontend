import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ClientePage from './pages/ClientePage.jsx';
import BarberoPage from './pages/BarberoPage.jsx';

function Nav() {
  const location = useLocation();
  return (
    <nav className="topnav">
      <div className="brand">HERNANDEZ 1</div>
      <div className="navlinks">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">
          Reservar turno
        </Link>
        <Link className={location.pathname === '/barbero' ? 'active' : ''} to="/barbero">
          Panel del barbero
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="app">
      <Nav />
      <Routes>
        <Route path="/" element={<ClientePage />} />
        <Route path="/barbero" element={<BarberoPage />} />
      </Routes>
    </div>
  );
}


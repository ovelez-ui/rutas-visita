import { createHashRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tiendas from './pages/Tiendas';
import Rutas from './pages/Rutas';
import Config from './pages/Config';

// HashRouter: funciona igual en dev, en hosting estático o abriendo el build.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tiendas', element: <Tiendas /> },
      { path: 'rutas', element: <Rutas /> },
      { path: 'config', element: <Config /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

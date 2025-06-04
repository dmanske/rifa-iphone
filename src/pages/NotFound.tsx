
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Se a rota contém 'success' ou tem session_id, redirecionar para home
    const urlParams = new URLSearchParams(location.search);
    if (location.pathname.includes('success') || urlParams.get('session_id')) {
      navigate('/?session_id=' + urlParams.get('session_id'), { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Página não encontrada</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;

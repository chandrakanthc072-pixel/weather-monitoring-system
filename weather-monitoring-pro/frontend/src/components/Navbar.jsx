import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCloudSun, FaSignOutAlt, FaUser, FaChartLine } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <FaCloudSun className="text-blue-500 text-3xl" />
                            <span className="font-bold text-xl text-white">WeatherPro</span>
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium">
                                    Dashboard
                                </Link>
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium flex items-center space-x-1">
                                        <FaChartLine />
                                        <span>Admin</span>
                                    </Link>
                                )}
                                <div className="flex items-center space-x-3 ml-4 border-l border-gray-600 pl-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                                        <FaUser />
                                        <span>{user.name}</span>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                    >
                                        <FaSignOutAlt />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-x-4">
                                <Link to="/login" className="text-gray-300 hover:text-white font-medium">Login</Link>
                                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

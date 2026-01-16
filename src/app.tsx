import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/index';
import Signup from './pages/signup';
import LoginCallback from './pages/callback';
import Register from './pages/register';
import Directory from './pages/directory';
import Profile from './pages/profile';
import Admin from './pages/admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/callback" element={<LoginCallback />} />
        <Route path="/register" element={<Register />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

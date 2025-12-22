import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/index';
import LoginCallback from './pages/callback';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<LoginCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

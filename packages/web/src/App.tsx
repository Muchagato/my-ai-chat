import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DemoPage } from '@/pages/DemoPage';
import { FuturePage } from '@/pages/FuturePage';
import { ChatPage } from '@/pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      {/* Watermark */}
      <div className="fixed top-4 left-0 right-0 flex justify-center pointer-events-none z-50">
        <span className="text-sm text-muted-foreground/40 font-medium tracking-wide select-none">
          Primary Orchestration Platform
        </span>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/future" element={<FuturePage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

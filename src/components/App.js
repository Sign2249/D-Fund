// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Main from './Main';
import RegisterProject from './RegisterProject';
import CheckProject from './CheckProject';
import AllProjects from './AllProjects';
import ProjectDetail from './ProjectDetail';
import ExpertReviewPage from './ExpertReviewPage';

function App() {
  const navLinkStyle = {
    textDecoration: 'none',
    color: '#222',
    fontWeight: 500,
    padding: '1.5rem 1rem',
    fontSize: '1rem',
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #ddd',
          fontFamily: 'Apple SD Gothic Neo, sans-serif',
          backgroundColor: '#fff',
        }}>
          <Link to="/" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textDecoration: 'none', color: '#222' }}>D-Fund</Link>

          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={navLinkStyle}>홈</Link>
            <Link to="/register" style={navLinkStyle}>프로젝트 등록</Link>
            <Link to="/check" style={navLinkStyle}>프로젝트 조회</Link>
            <Link to="/projects" style={navLinkStyle}>전체 프로젝트 보기</Link>
          </nav>
        </header>

        <main style={{ padding: '2rem', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/register" element={<RegisterProject />} />
            <Route path="/check" element={<CheckProject />} />
            <Route path="/projects" element={<AllProjects />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/expert-review" element={<ExpertReviewPage />} />
          </Routes>
        </main>

        <footer style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#888' }}>© 2025 D-Fund. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 
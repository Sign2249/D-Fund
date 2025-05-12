// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Main from './Main';
import RegisterProject from './RegisterProject';
import CheckProject from './CheckProject';
import AllProjects from './AllProjects';
import ProjectDetail from './ProjectDetail';




function App() {
  return (
    <Router>
      <div>
        {/* 전역 헤더 */}
        <header style={{ padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <h1>D-Fund</h1>
          {/* 네비게이션 버튼 */}
          <nav>
            <Link to="/" style={{ marginRight: '1rem' }}>🏠 홈</Link>
            <Link to="/register" style={{ marginRight: '1rem' }}>➕ 프로젝트 등록</Link>
            <Link to="/check" style={{ marginRight: '1rem' }}>🔍 프로젝트 조회</Link>
            <Link to="/projects" >📋 전체 프로젝트 보기</Link>
          </nav>
        </header>

        {/* 라우팅 */}
        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/register" element={<RegisterProject />} />
            <Route path="/check" element={<CheckProject />} />
            <Route path="/projects" element={<AllProjects />} />
            <Route path="/project/:id" element={<ProjectDetail />} />

          </Routes>
        </main>

        {/* 전역 푸터 */}
        <footer style={{ padding: '1rem', backgroundColor: '#eee', marginTop: '2rem' }}>
          <p>© 2024 D-Fund. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

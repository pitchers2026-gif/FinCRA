
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Journey from './pages/Journey';
import RuleBuilder from './pages/RuleBuilder';
import DataReference from './pages/DataReference';
import Simulations from './pages/Simulations';
import Governance from './pages/Governance';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Journey />} />
          <Route path="/rules" element={<RuleBuilder />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/reference" element={<DataReference />} />
          <Route path="/governance" element={<Governance />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

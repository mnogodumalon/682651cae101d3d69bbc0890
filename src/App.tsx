import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import UnternehmensverwaltungPage from '@/pages/UnternehmensverwaltungPage';
import SchichtartenverwaltungPage from '@/pages/SchichtartenverwaltungPage';
import SchichteinteilungPage from '@/pages/SchichteinteilungPage';
import MitarbeiterverwaltungPage from '@/pages/MitarbeiterverwaltungPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="unternehmensverwaltung" element={<UnternehmensverwaltungPage />} />
          <Route path="schichtartenverwaltung" element={<SchichtartenverwaltungPage />} />
          <Route path="schichteinteilung" element={<SchichteinteilungPage />} />
          <Route path="mitarbeiterverwaltung" element={<MitarbeiterverwaltungPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
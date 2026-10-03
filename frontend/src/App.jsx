// Route table. Every route is pre-registered here so agents never need to edit this file.
// Owners: see AGENTS.md
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Place from './pages/Place.jsx'
import PlaceHistory from './pages/PlaceHistory.jsx'
import RoutePlanner from './pages/RoutePlanner.jsx'
import Needs from './pages/Needs.jsx'
import Report from './pages/Report.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Data from './pages/Data.jsx'
import ForBusiness from './pages/ForBusiness.jsx'
import ForCities from './pages/ForCities.jsx'
import Faq from './pages/Faq.jsx'
import AccessibilityStatement from './pages/AccessibilityStatement.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Licenses from './pages/Licenses.jsx'
import NotFound from './pages/NotFound.jsx'
import Widget from './pages/Widget.jsx'

export default function App() {
  return (
    <Routes>
      {/* embeddable widget: no site chrome */}
      <Route path="/widget/:id" element={<Widget />} />
      {/* app section: bottom navigation */}
      <Route element={<Layout app />}>
        <Route path="/szukaj" element={<Search />} />
        <Route path="/miejsce/:id" element={<Place />} />
        <Route path="/miejsce/:id/historia" element={<PlaceHistory />} />
        <Route path="/trasa" element={<RoutePlanner />} />
        <Route path="/moje-potrzeby" element={<Needs />} />
        <Route path="/zglos" element={<Report />} />
      </Route>
      {/* info + formal section: menu only */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jak-to-dziala" element={<HowItWorks />} />
        <Route path="/dane" element={<Data />} />
        <Route path="/dla-firm" element={<ForBusiness />} />
        <Route path="/dla-miast" element={<ForCities />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/dostepnosc" element={<AccessibilityStatement />} />
        <Route path="/prywatnosc" element={<Privacy />} />
        <Route path="/regulamin" element={<Terms />} />
        <Route path="/licencje" element={<Licenses />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Installments from './pages/Installments';
import Budget from './pages/Budget';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/expenses"      element={<Expenses />} />
            <Route path="/installments"  element={<Installments />} />
            <Route path="/budget"        element={<Budget />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

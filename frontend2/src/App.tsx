import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@shared/components/layout/AppLayout';
import PreLogin from '@app/pages/PreLogin';
import HomePage from '@app/pages/HomePage';
import BettingPage from '@app/pages/BettingPage';
import LeaderboardPage from '@app/pages/LeaderboardPage';
import ProfilePage from '@app/pages/ProfilePage';
import LoginPage from '@app/pages/LoginPage';
import SignupPage from '@app/pages/SignupPage';
import RequireAuth from '@shared/components/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PreLogin />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="play" element={<BettingPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

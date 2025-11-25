import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './shared/components/layout/AppLayout';
import HomePage from './app/pages/HomePage';
import BettingPage from './app/pages/BettingPage';
import BettingPageV2 from './app/pages/BettingPageV2';
import LeaderboardPage from './app/pages/LeaderboardPage';
import ProfilePage from './app/pages/ProfilePage';
import SignupPage from './app/pages/SignupPage';
import LoginPage from './app/pages/LoginPage';
import StockMarketPage from './app/pages/StockMarketPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Original routes (old API - event-market groups) */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<BettingPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="stocks" element={<StockMarketPage />} />
        </Route>
        {/* V2 routes (new lazy loading API) */}
        <Route path="/v2" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<BettingPageV2 />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="stocks" element={<StockMarketPage />} />
        </Route>
        {/* Test routes (legacy) */}
        <Route path="/test" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<BettingPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="stocks" element={<StockMarketPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

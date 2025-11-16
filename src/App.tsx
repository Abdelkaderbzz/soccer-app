import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Matches from "@/pages/Matches";
import MatchDetails from "@/pages/MatchDetails";
import CreateMatch from "@/pages/CreateMatch";
import PlayerProfile from "@/pages/PlayerProfile";
import Players from "@/pages/Players";
import Clubs from "@/pages/Clubs";
import ClubDetail from "@/pages/ClubDetail";
import Statistics from "@/pages/Statistics";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SubmitMatchResult from "@/components/SubmitMatchResult";
import Navigation from "@/components/Navigation";
import { useStore } from "@/store/useStore";

export default function App() {
  const { getCurrentUser, token, currentUser } = useStore();

  useEffect(() => {
    // Check for authentication on app load
    if (token) {
      getCurrentUser();
    }
  }, [token, getCurrentUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {currentUser && <Navigation />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {currentUser ? (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/matches/create" element={<CreateMatch />} />
                <Route path="/matches/:id" element={<MatchDetails />} />
                <Route path="/matches/:id/submit-result" element={<SubmitMatchResult />} />
                <Route path="/players" element={<Players />} />
                <Route path="/players/:id" element={<PlayerProfile />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/:id" element={<ClubDetail />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

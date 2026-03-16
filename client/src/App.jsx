import { useState } from "react";
import BuddyMate from "./BuddyMate";
import RoommateApp from "./RoommateApp";
import './index.css';

function App() {
  // This state remembers which page we are on
  const [currentPage, setCurrentPage] = useState('home');

  // If the state is 'roommate', show the new app we built
  if (currentPage === 'roommate') {
    return <RoommateApp onBack={() => setCurrentPage('home')} />;
  }

  // Otherwise, show your original landing page
  return <BuddyMate onNavigate={() => setCurrentPage('roommate')} />;
}

export default App;
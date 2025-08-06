import React from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Import all the hooks we need to gather data for the dashboard
import useConnections from '../hooks/useConnections';
import usePersons from '../hooks/usePersons';
import useFamilyWall from '../hooks/useFamilyWall';

// A simple component for the stat cards
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`bg-${color}-100 text-${color}-600 rounded-full h-12 w-12 flex items-center justify-center`}>
      <i className={`fas ${icon} fa-lg`}></i>
    </div>
  </div>
);

export default function DashboardPage() {
  const user = auth.currentUser;
  const { accepted: connections, incoming: pendingRequests } = useConnections(user);
  const { allPersons } = usePersons(user, connections);
  const { posts } = useFamilyWall(user, connections);

  const [localError, setLocalError] = React.useState('');

  // --- NEW: Function to get the nearest upcoming birthday details ---
  const getNearestUpcomingBirthday = () => {
    if (!allPersons || allPersons.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nearestBirthday = null;
    let minDiffDays = Infinity;

    allPersons.forEach(person => {
      if (person.birthDate) {
        const birthDate = new Date(person.birthDate + 'T00:00:00');
        let nextBirthday = new Date(birthDate);
        nextBirthday.setFullYear(today.getFullYear());

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < minDiffDays) {
          minDiffDays = diffDays;
          nearestBirthday = {
            name: `${person.firstName} ${person.lastName}`,
            daysUntil: diffDays,
          };
        }
      }
    });
    return nearestBirthday;
  };
  // --- END NEW FUNCTION ---

  const familyMembersCount = allPersons.length;
  const nearestBirthday = getNearestUpcomingBirthday(); // Get the details
  const pendingRequestsCount = pendingRequests.length;
  const wallPostsCount = posts.length;

  // --- Connection Management Functions (No changes here) ---
  const handleAcceptRequest = async (connectionId) => {
    const connectionRef = doc(db, "connections", connectionId);
    try {
      await updateDoc(connectionRef, { status: 'accepted' });
    } catch (err) {
      setLocalError("Failed to accept request.");
      console.error("Error accepting request:", err);
    }
  };

  const handleDeclineRequest = async (connectionId) => {
    const connectionRef = doc(db, "connections", connectionId);
    try {
      await deleteDoc(connectionRef);
    } catch (err) {
      setLocalError("Failed to decline request.");
      console.error("Error declining request:", err);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user?.email.split('@')[0]}!</h2>
        <p className="text-gray-500 mt-1">Here's what's happening in your family circle.</p>
      </header>

      {localError && <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">{localError}</p>}

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Family Members" value={familyMembersCount} icon="fa-users" color="teal" />
        <StatCard title="Upcoming Birthdays" value={nearestBirthday ? '1' : '0'} icon="fa-birthday-cake" color="blue" /> {/* Value can be 1 or 0 based on nearestBirthday */}
        <StatCard title="Pending Requests" value={pendingRequestsCount} icon="fa-user-plus" color="orange" />
        <StatCard title="Wall Posts" value={wallPostsCount} icon="fa-comments" color="purple" />
      </div>

      {/* Main Grid: Family List Preview & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Family List Preview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Family Members Preview</h3>
            <Link to="/family-list" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm">
              <i className="fas fa-users mr-2"></i>View All
            </Link>
          </div>
          <div className="space-y-4">
            {allPersons.slice(0, 5).map(person => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center">
                  <img src={`https://placehold.co/40x40/22c55e/ffffff?text=${person.firstName?.[0].toUpperCase() || '?'}`} alt="Avatar" className="h-10 w-10 rounded-full object-cover"/>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-800">{person.firstName} {person.lastName}</p>
                    <p className="text-sm text-gray-500">Born: {person.birthDate || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            ))}
            {allPersons.length === 0 && (
              <p className="text-gray-500 text-center">No family members added yet. Go to <Link to="/family-list" className="text-teal-600 hover:underline">Family List</Link> to add some!</p>
            )}
            {allPersons.length > 5 && (
                 <Link to="/family-list" className="w-full text-center text-teal-600 font-semibold hover:underline block pt-2">View All Members</Link>
            )}
          </div>
        </div>

        {/* Right Column: Notifications & Requests */}
        <div className="space-y-8 lg:col-span-1">
          {/* Upcoming Birthdays Card - Now shows specific nearest birthday */}
          {nearestBirthday && ( // Only show if there's a nearest birthday
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Birthdays</h3>
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg flex items-center">
                  <i className="fas fa-birthday-cake fa-lg mr-4"></i>
                  <div>
                      <p className="font-semibold">{nearestBirthday.name}</p>
                      <p className="text-sm">
                        Birthday is {' '}
                        {nearestBirthday.daysUntil === 0 ? (
                            <strong>today!</strong>
                        ) : (
                            `in ${nearestBirthday.daysUntil} day(s)`
                        )}
                      </p>
                  </div>
              </div>
              <Link to="/events" className="w-full text-center text-blue-600 font-semibold hover:underline block pt-2">View All Events</Link>
            </div>
          )}

          {/* Connection Request Card - Matching dashboard.html design */}
          {pendingRequestsCount > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Connection Request</h3>
              {pendingRequests.slice(0, 1).map(req => ( // Show only the first pending request for brevity
                <div key={req.id} className="border border-gray-200 p-4 rounded-lg mb-3 last:mb-0">
                  <p className="text-gray-700 mb-3">Request from: <span className="font-semibold">{req.requesterEmail}</span></p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequestsCount > 1 && (
                  <Link to="/family-list" className="w-full text-center text-orange-600 font-semibold hover:underline block pt-2">View All Requests</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

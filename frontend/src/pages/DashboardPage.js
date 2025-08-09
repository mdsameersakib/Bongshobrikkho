import React from 'react';
import { Link } from 'react-router-dom';
import { getDisplayName } from '../utils/displayName';
import { formatDateDMY } from '../utils/date';
import { useAuth } from '../context/AuthContext';

// Import all the necessary hooks
import useConnections from '../hooks/useConnections';
import usePersons from '../hooks/usePersons';
import useFamilyWall from '../hooks/useFamilyWall';
import useEvents from '../hooks/useEvents';
import useCategorizedEvents from '../hooks/useCategorizedEvents';
import useCouples from '../hooks/useCouples';

// A simple component for the stat cards
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
    <div
      className={`bg-${color}-100 text-${color}-600 rounded-full h-12 w-12 flex items-center justify-center`}
    >
      <i className={`fas ${icon} fa-lg`}></i>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  // --- REFACTORED: Hook now provides the action functions ---
  const {
    incoming: pendingRequests,
    acceptRequest,
    declineRequest,
    error: connectionError,
  } = useConnections();

  const { allPersons } = usePersons();
  const friendlyName = getDisplayName(user?.uid, user?.email, allPersons);
  const { posts } = useFamilyWall();
  const { customEvents } = useEvents();
  const { couples } = useCouples();
  const { upcoming } = useCategorizedEvents(allPersons, customEvents, couples, user);
  const nearestBirthday = upcoming.length > 0 ? upcoming[0] : null;

  const familyMembersCount = allPersons.length;
  const pendingRequestsCount = pendingRequests.length;
  const wallPostsCount = posts.length;

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr + 'T00:00:00');
    let nextOccurrence = new Date(eventDate);
    nextOccurrence.setFullYear(today.getFullYear());

    if (nextOccurrence < today) {
      nextOccurrence.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextOccurrence - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <header className="mb-8">
  <h2 className="text-3xl font-bold text-gray-800">Welcome back, {friendlyName}!</h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening in your family circle.
        </p>
      </header>

      {connectionError && (
        <p className="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {connectionError}
        </p>
      )}

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Family Members"
          value={familyMembersCount}
          icon="fa-users"
          color="teal"
        />
        <StatCard
          title="Upcoming Events"
          value={upcoming.length}
          icon="fa-birthday-cake"
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequestsCount}
          icon="fa-user-plus"
          color="orange"
        />
        <StatCard
          title="Wall Posts"
          value={wallPostsCount}
          icon="fa-comments"
          color="purple"
        />
      </div>

      {/* Main Grid: Family List Preview & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Family List Preview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Family Members Preview
            </h3>
            <Link
              to="/family-list"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm"
            >
              <i className="fas fa-users mr-2"></i>View All
            </Link>
          </div>
          <div className="space-y-4">
            {allPersons.slice(0, 5).map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center">
                  <img
                    src={`https://placehold.co/40x40/22c55e/ffffff?text=${
                      person.firstName?.[0].toUpperCase() || '?'
                    }`}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-800">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Born: {person.birthDate ? formatDateDMY(person.birthDate) : 'N/A'}</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            ))}
            {allPersons.length === 0 && (
              <p className="text-gray-500 text-center">
                No family members added yet. Go to{' '}
                <Link to="/family-list" className="text-teal-600 hover:underline">
                  Family List
                </Link>{' '}
                to add some!
              </p>
            )}
            {allPersons.length > 5 && (
              <Link
                to="/family-list"
                className="w-full text-center text-teal-600 font-semibold hover:underline block pt-2"
              >
                View All Members
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Notifications & Requests */}
        <div className="space-y-8 lg:col-span-1">
          {/* Upcoming Birthdays Card */}
          {nearestBirthday && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Next Upcoming Event
              </h3>
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg flex items-center">
                <i className="fas fa-birthday-cake fa-lg mr-4"></i>
                <div>
                  <p className="font-semibold">{nearestBirthday.personName}</p>
                  <p className="text-sm">
                    {getDaysUntil(nearestBirthday.date) === 0 ? (
                      <strong>Today!</strong>
                    ) : (
                      `In ${getDaysUntil(nearestBirthday.date)} day(s)`
                    )}
                  </p>
                </div>
              </div>
              <Link
                to="/events"
                className="w-full text-center text-blue-600 font-semibold hover:underline block pt-2"
              >
                View All Events
              </Link>
            </div>
          )}

          {/* Connection Request Card */}
          {pendingRequestsCount > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Connection Request
              </h3>
              {pendingRequests.slice(0, 1).map((req) => (
                <div
                  key={req.id}
                  className="border border-gray-200 p-4 rounded-lg mb-3 last:mb-0"
                >
                  <p className="text-gray-700 mb-3">
                    Request from:{' '}
                    <span className="font-semibold">{req.requesterName || req.requesterEmail}</span>
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequestsCount > 1 && (
                <Link
                  to="/family-list"
                  className="w-full text-center text-orange-600 font-semibold hover:underline block pt-2"
                >
                  View All Requests
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
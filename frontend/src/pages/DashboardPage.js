import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/firebase';

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
  
  // Use our custom hooks to get all the data for the page
  const { accepted: connections, incoming: pendingRequests } = useConnections(user);
  const { allPersons } = usePersons(user, connections);
  const { posts } = useFamilyWall(user, connections);

  // Calculate the number of upcoming birthdays (logic from our old Notifications component)
  const getUpcomingBirthdaysCount = () => {
    if (!allPersons || allPersons.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    allPersons.forEach(person => {
      if (person.birthDate) {
        const birthDate = new Date(person.birthDate + 'T00:00:00');
        const nextBirthday = new Date(birthDate);
        nextBirthday.setFullYear(today.getFullYear());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) { // Let's count for the next 30 days
          count++;
        }
      }
    });
    return count;
  };

  const familyMembersCount = allPersons.length;
  const upcomingBirthdaysCount = getUpcomingBirthdaysCount();
  const pendingRequestsCount = pendingRequests.length;
  const wallPostsCount = posts.length;

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user?.email.split('@')[0]}!</h2>
        <p className="text-gray-500 mt-1">Here's what's happening in your family circle.</p>
      </header>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Family Members" value={familyMembersCount} icon="fa-users" color="teal" />
        <StatCard title="Upcoming Birthdays" value={upcomingBirthdaysCount} icon="fa-birthday-cake" color="blue" />
        <StatCard title="Pending Requests" value={pendingRequestsCount} icon="fa-user-plus" color="orange" />
        <StatCard title="Wall Posts" value={wallPostsCount} icon="fa-comments" color="purple" />
      </div>

      {/* Main Grid: Family List Preview */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Family Members Preview</h3>
          <Link to="/family-list" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm">
            <i className="fas fa-users mr-2"></i>View All
          </Link>
        </div>
        <div className="space-y-4">
          {allPersons.slice(0, 5).map(person => ( // Show a preview of the first 5 members
            <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <img src={`https://placehold.co/40x40/22c55e/ffffff?text=${person.firstName?.[0].toUpperCase()}`} alt="Avatar" className="h-10 w-10 rounded-full object-cover"/>
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
        </div>
      </div>
    </>
  );
}
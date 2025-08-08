import React from 'react';
import { useAuth } from '../context/AuthContext'; // <-- Import useAuth

// Import our custom hooks
import usePersons from '../hooks/usePersons';
import useEvents from '../hooks/useEvents';
import useCategorizedEvents from '../hooks/useCategorizedEvents';

// Helper to format dates
const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function EventsPage() {
    const { user } = useAuth(); // <-- Get user from context

    // --- REFACTORED: Hooks called without arguments ---
    const { allPersons } = usePersons();
    const { customEvents } = useEvents();

    // Process all data with our logic hook
    const { upcoming, later, remembrance } = useCategorizedEvents(allPersons, customEvents, user);

    // Render the UI
    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Family Events</h2>
                    <p className="text-gray-500 mt-1">Keep track of important dates and milestones.</p>
                </div>
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                    <i className="fas fa-plus mr-2"></i>Add New Event
                </button>
            </header>

            <div className="space-y-10">
                {/* Upcoming Events Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Upcoming in the next 30 days</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcoming.map((event, index) => (
                            <div key={index} className={`bg-white p-5 rounded-xl shadow-md border-l-4 ${event.type === 'birthday' ? 'border-blue-500' : 'border-pink-500'}`}>
                                <p className="font-semibold text-gray-800">{event.personName}</p>
                                <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                            </div>
                        ))}
                        {upcoming.length === 0 && <p className="text-gray-500">No events in the next 30 days.</p>}
                    </div>
                </div>

                {/* Later This Year Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Later This Year</h3>
                    <div className="space-y-4">
                        {later.map((event, index) => (
                             <div key={index} className="bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow">
                                <p className="font-semibold text-gray-800">{event.personName}</p>
                                <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                             </div>
                        ))}
                        {later.length === 0 && <p className="text-gray-500">No other events scheduled this year.</p>}
                    </div>
                </div>

                {/* Days of Remembrance Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">In Loving Memory</h3>
                    <div className="space-y-4">
                        {remembrance.map((event, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow">
                                <div>
                                    <p className="font-semibold text-gray-800">{event.personName}</p>
                                    <p className="text-sm text-gray-500">Remembrance Day</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                                    <p className="text-xs text-gray-400">{event.lifespan}</p>
                                </div>
                            </div>
                        ))}
                        {remembrance.length === 0 && <p className="text-gray-500">No remembrance days recorded.</p>}
                    </div>
                </div>
            </div>
             <div className="mt-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg" role="alert">
                <p className="font-bold">Developer Note:</p>
                <p>The "Add New Event" button is still a placeholder. We can build the form for it in a future step.</p>
            </div>
        </>
    );
}
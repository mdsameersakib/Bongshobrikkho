import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';

// Import our custom hooks
import useConnections from '../hooks/useConnections';
import usePersons from '../hooks/usePersons';
import useEvents from '../hooks/useEvents';

// Helper to format dates
const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function EventsPage() {
    const user = auth.currentUser;
    const { accepted: connections } = useConnections(user);
    const { allPersons } = usePersons(user, connections);
    const { customEvents } = useEvents(user, connections);

    const [categorizedEvents, setCategorizedEvents] = useState({
        upcoming: [],
        later: [],
        remembrance: []
    });

    // This large effect processes all person and event data into a displayable format
    useEffect(() => {
        if (allPersons.length === 0 && customEvents.length === 0) return;

        const allGeneratedEvents = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Process events from person data (Birthdays, Anniversaries, etc.)
        allPersons.forEach(person => {
            // Remembrance Days
            if (person.deathDate) {
                allGeneratedEvents.push({
                    type: 'remembrance',
                    date: person.deathDate,
                    personName: `${person.firstName} ${person.lastName}`,
                    lifespan: `${new Date(person.birthDate).getFullYear()} - ${new Date(person.deathDate).getFullYear()}`
                });
            } 
            // Birthdays
            else if (person.birthDate) {
                allGeneratedEvents.push({
                    type: 'birthday',
                    date: person.birthDate,
                    personName: `${person.firstName} ${person.lastName}'s Birthday`,
                    age: today.getFullYear() - new Date(person.birthDate).getFullYear()
                });
            }
            // Anniversaries (only process once per couple)
            if (person.marriageDate && person.spouse && user.uid < person.spouse) {
                 const spouse = allPersons.find(p => p.id === person.spouse);
                 if (spouse) {
                    allGeneratedEvents.push({
                        type: 'anniversary',
                        date: person.marriageDate,
                        personName: `${person.firstName} & ${spouse.firstName}`,
                    });
                 }
            }
        });
        
        // 2. Process custom events
        customEvents.forEach(event => {
            allGeneratedEvents.push({
                type: 'custom',
                date: event.date, // Assuming date is stored as "YYYY-MM-DD"
                personName: event.title, // Use title for the name
            });
        });

        // 3. Categorize all events
        const upcoming = [];
        const later = [];
        const remembrance = [];
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        allGeneratedEvents.forEach(event => {
            if (event.type === 'remembrance') {
                remembrance.push(event);
                return;
            }

            const eventDateThisYear = new Date(event.date);
            eventDateThisYear.setFullYear(today.getFullYear());

            if (eventDateThisYear < today) {
                eventDateThisYear.setFullYear(today.getFullYear() + 1);
            }
            
            event.displayDate = eventDateThisYear;

            if (eventDateThisYear >= today && eventDateThisYear <= thirtyDaysFromNow) {
                upcoming.push(event);
            } else {
                later.push(event);
            }
        });
        
        // Sort events within categories
        const sortByDate = (a, b) => a.displayDate - b.displayDate;
        upcoming.sort(sortByDate);
        later.sort(sortByDate);
        remembrance.sort((a,b) => new Date(a.date) - new Date(b.date));

        setCategorizedEvents({ upcoming, later, remembrance });

    }, [allPersons, customEvents, user]);

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Family Events</h2>
                    <p className="text-gray-500 mt-1">Keep track of important dates and milestones.</p>
                </div>
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                    <i className="fas fa-plus mr-2"></i>Add New Event
                </button>
            </header>

            <div className="space-y-10">
                {/* Upcoming Events Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Upcoming in the next 30 days</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categorizedEvents.upcoming.map((event, index) => (
                            <div key={index} className={`bg-white p-5 rounded-xl shadow-md border-l-4 ${event.type === 'birthday' ? 'border-blue-500' : 'border-pink-500'}`}>
                                <p className="font-semibold text-gray-800">{event.personName}</p>
                                <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                            </div>
                        ))}
                        {categorizedEvents.upcoming.length === 0 && <p className="text-gray-500">No events in the next 30 days.</p>}
                    </div>
                </div>

                {/* Later This Year Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Later This Year</h3>
                    <div className="space-y-4">
                        {categorizedEvents.later.map((event, index) => (
                             <div key={index} className="bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow">
                                <p className="font-semibold text-gray-800">{event.personName}</p>
                                <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                             </div>
                        ))}
                        {categorizedEvents.later.length === 0 && <p className="text-gray-500">No other events scheduled this year.</p>}
                    </div>
                </div>

                {/* Days of Remembrance Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">In Loving Memory</h3>
                    <div className="space-y-4">
                        {categorizedEvents.remembrance.map((event, index) => (
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
                        {categorizedEvents.remembrance.length === 0 && <p className="text-gray-500">No remembrance days recorded.</p>}
                    </div>
                </div>
            </div>
             <div className="mt-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg" role="alert">
                <p className="font-bold">Developer Note:</p>
                <p>The "Add New Event" button is a placeholder. Our next step will be to upgrade the Edit/Add forms to include fields for Marriage Date and Date of Death.</p>
            </div>
        </>
    );
}
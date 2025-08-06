import { useState, useEffect } from 'react';

// This hook processes raw data into categorized event lists
export default function useCategorizedEvents(allPersons, customEvents, user) {
  const [categorizedEvents, setCategorizedEvents] = useState({
    upcoming: [],
    later: [],
    remembrance: []
  });

  useEffect(() => {
    if ((!allPersons || allPersons.length === 0) && (!customEvents || customEvents.length === 0)) {
        setCategorizedEvents({ upcoming: [], later: [], remembrance: [] });
        return;
    }

    const allGeneratedEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Process events from person data
    allPersons.forEach(person => {
        if (person.deathDate) {
            allGeneratedEvents.push({
                type: 'remembrance', date: person.deathDate,
                personName: `${person.firstName} ${person.lastName}`,
                lifespan: `${new Date(person.birthDate).getFullYear()} - ${new Date(person.deathDate).getFullYear()}`
            });
        } else if (person.birthDate) {
            allGeneratedEvents.push({
                type: 'birthday', date: person.birthDate,
                personName: `${person.firstName} ${person.lastName}'s Birthday`,
                age: today.getFullYear() - new Date(person.birthDate).getFullYear()
            });
        }
        if (person.marriageDate && person.spouse && user.uid < person.spouse) {
            const spouse = allPersons.find(p => p.id === person.spouse);
            if (spouse) {
                allGeneratedEvents.push({
                    type: 'anniversary', date: person.marriageDate,
                    personName: `${person.firstName} & ${spouse.firstName}`,
                });
            }
        }
    });
    
    // 2. Process custom events
    customEvents.forEach(event => {
        allGeneratedEvents.push({
            type: 'custom', date: event.date,
            personName: event.title,
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

        const eventDate = new Date(event.date + 'T00:00:00');
        let eventDateThisYear = new Date(eventDate);
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
    
    // 4. Sort events within categories
    const sortByDate = (a, b) => a.displayDate - b.displayDate;
    upcoming.sort(sortByDate);
    later.sort(sortByDate);
    remembrance.sort((a,b) => new Date(a.date).getMonth() - new Date(b.date).getMonth() || new Date(a.date).getDate() - new Date(b.date).getDate());

    setCategorizedEvents({ upcoming, later, remembrance });

  }, [allPersons, customEvents, user]);

  return categorizedEvents;
}
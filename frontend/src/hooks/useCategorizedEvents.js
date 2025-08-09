import { useState, useEffect } from 'react';
import { nextOccurrence, yearsSince, parseISODate } from '../utils/date';

// This hook processes raw data (persons, couples & custom events) into categorized event lists
// Signature extended to accept couples for authoritative anniversary sourcing.
export default function useCategorizedEvents(allPersons, customEvents, couples, user) {
  const [categorizedEvents, setCategorizedEvents] = useState({
    upcoming: [],
    later: [],
    remembrance: []
  });

  useEffect(() => {
        if ((!allPersons || allPersons.length === 0) && (!customEvents || customEvents.length === 0) && (!couples || couples.length === 0)) {
            setCategorizedEvents({ upcoming: [], later: [], remembrance: [] });
            return;
        }

    const allGeneratedEvents = [];
    const today = new Date();
    today.setHours(0,0,0,0);

        const personMap = new Map(allPersons.map(p => [p.id, p]));

    // 1. Process remembrance & birthdays from persons
        allPersons.forEach(person => {
            if (person.deathDate) {
                allGeneratedEvents.push({
                    type: 'remembrance',
                    date: person.deathDate,
                    personName: `${person.firstName} ${person.lastName}`,
            lifespan: `${parseISODate(person.birthDate)?.getFullYear() ?? ''} - ${parseISODate(person.deathDate)?.getFullYear() ?? ''}`
                });
            } else if (person.birthDate) {
                allGeneratedEvents.push({
                    type: 'birthday',
                    date: person.birthDate,
            personName: `${person.firstName} ${person.lastName}'s Birthday`,
            age: yearsSince(person.birthDate, today)
                });
            }
        });

        // 2. Anniversaries from couples collection (authoritative). Avoid duplicates with a set.
        const seenAnniversaryKeys = new Set();
    couples?.forEach(c => {
            if (!c.marriageDate) return;
            const husband = personMap.get(c.husbandId);
            const wife = personMap.get(c.wifeId);
            if (!husband || !wife) return;
            const key = [c.husbandId, c.wifeId].sort().join('|') + '|' + c.marriageDate;
            if (seenAnniversaryKeys.has(key)) return;
            seenAnniversaryKeys.add(key);
            allGeneratedEvents.push({
                type: 'anniversary',
                date: c.marriageDate,
        personName: `${husband.firstName} & ${wife.firstName}'s Anniversary`,
        years: yearsSince(c.marriageDate, today)
            });
        });

        // 3. Custom events
        customEvents.forEach(event => {
            allGeneratedEvents.push({
                type: 'custom',
                date: event.date,
                personName: event.title,
                id: event.id,
                raw: event,
                creatorUid: event.creatorUid
            });
        });

        // 4. Categorize (remembrance separate; others upcoming/later based on next occurrence within 30 days)
        const upcoming = [];
        const later = [];
        const remembrance = [];
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

                allGeneratedEvents.forEach(evt => {
                    if (evt.type === 'remembrance') {
                        remembrance.push(evt);
                        return;
                    }
                    const next = nextOccurrence(evt.date, today);
                    if (!next) return; // skip invalid
                    evt.displayDate = next;
                    if (next >= today && next <= thirtyDaysFromNow) {
                        upcoming.push(evt);
                    } else {
                        later.push(evt);
                    }
                });

        // 5. Sort
        const sortByDate = (a,b) => a.displayDate - b.displayDate;
        upcoming.sort(sortByDate);
        later.sort(sortByDate);
        remembrance.sort((a,b) => new Date(a.date).getMonth() - new Date(b.date).getMonth() || new Date(a.date).getDate() - new Date(b.date).getDate());

        setCategorizedEvents({ upcoming, later, remembrance });
    }, [allPersons, customEvents, couples, user]);

  return categorizedEvents;
}
// import React, { useState, useEffect } from 'react';

// // This component receives the full list of all people in the family tree.
// function Notifications({ allPersons }) {
//   // This state will hold a list of people with upcoming birthdays.
//   const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

//   // This useEffect hook will run whenever the list of people changes.
//   useEffect(() => {
//     // We only want to run this code if we have a list of people.
//     if (!allPersons || allPersons.length === 0) {
//       return;
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set to the beginning of the day for accurate comparison

//     const upcoming = [];

//     allPersons.forEach(person => {
//       // Make sure the person has a birth date entered.
//       if (person.birthDate) {
//         // The birth date is a string like "2000-11-29". We need to adjust it for comparison.
//         const birthDate = new Date(person.birthDate + 'T00:00:00');
        
//         // Set the year of their next birthday to the current year.
//         const nextBirthday = new Date(birthDate);
//         nextBirthday.setFullYear(today.getFullYear());

//         // If their birthday has already passed this year, check for next year's birthday.
//         if (nextBirthday < today) {
//           nextBirthday.setFullYear(today.getFullYear() + 1);
//         }

//         // Calculate the difference between today and their next birthday in milliseconds.
//         const diffTime = nextBirthday - today;
//         // Convert the difference to days.
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//         // We'll show a notification if the birthday is today or within the next 7 days.
//         if (diffDays >= 0 && diffDays <= 7) {
//           upcoming.push({
//             name: `${person.firstName} ${person.lastName}`,
//             daysUntil: diffDays,
//           });
//         }
//       }
//     });

//     // Update the state with the list of people we found.
//     setUpcomingBirthdays(upcoming);
//   }, [allPersons]); // Rerun this logic whenever the allPersons list changes.

//   // If there are no upcoming birthdays, this component will show nothing.
//   if (upcomingBirthdays.length === 0) {
//     return null;
//   }

//   // If there are upcoming birthdays, we show the notification card.
//   return (
//     <div className="card notification-card">
//       <h2>Upcoming Birthdays</h2>
//       <div className="notifications-list">
//         {upcomingBirthdays.map((bday, index) => (
//           <div key={index} className="notification-item">
//             <p>
//               <strong>{bday.name}'s</strong> birthday is {' '}
//               {bday.daysUntil === 0 ? <strong>today!</strong> : `in ${bday.daysUntil} day(s).`}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Notifications;

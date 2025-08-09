import React, { useMemo } from 'react';
import usePersons from '../hooks/usePersons';
import useFamilyList from '../hooks/useFamilyList';
import useCouples from '../hooks/useCouples';
import { calculateTreeLayout } from '../hooks/useTreeLayout';
import TreeCanvas from '../components/TreeCanvas';

export default function FamilyTreePage() {
  // 1. Fetch all necessary data first. The hook provides loading state.
  const { allPersons, userPerson, error, loading } = usePersons();
  const { couples } = useCouples();
  const { getRelationshipToUser } = useFamilyList();

  // 2. Calculate the layout only when the data is available.
  //    useMemo prevents recalculating on every render.
  const layout = useMemo(() => {
    if (!userPerson || !allPersons.length) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }
    // Add the relationship to each person before calculating layout
    const personsWithRelationships = allPersons.map(p => ({
        ...p,
        relationship: getRelationshipToUser(p)
    }));

    return calculateTreeLayout(personsWithRelationships, userPerson, couples);
  }, [allPersons, userPerson, couples, getRelationshipToUser]);

  // 3. Handle loading and error states explicitly.
  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="text-gray-500">Loading Family Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center border rounded-lg bg-red-50 text-red-700 p-4">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!userPerson) {
      return (
      <div className="w-full h-[70vh] flex items-center justify-center border rounded-lg bg-yellow-50 text-yellow-800 p-4">
        <div>
          <p className="font-bold text-lg">Your Profile Not Found</p>
          <p>We couldn't find your profile in the database. Please try logging out and back in.</p>
        </div>
      </div>
    );
  }

  if (layout.nodes.length === 0) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center border rounded-lg bg-gray-50">
        <div className="text-gray-500">
          No family members found. Add some from the Family List page.
        </div>
      </div>
    );
  }

  // 4. Render the canvas with the calculated layout
  return (
    <div className="w-full h-full flex flex-col">
      <header className="mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Family Tree</h2>
        <p className="text-gray-500 text-sm">
          A perfectly balanced tree, centered on you.
        </p>
      </header>
      <div className="flex-grow w-full">
        <TreeCanvas layout={layout} />
      </div>
    </div>
  );
}
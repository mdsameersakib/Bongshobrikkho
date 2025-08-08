import React, { useMemo } from 'react';
import usePersons from '../hooks/usePersons';
import useFamilyList from '../hooks/useFamilyList';
import calculateTreeLayout from '../hooks/useCalculateTreeLayout';
import TreeCanvas from '../components/TreeCanvas';

export default function FamilyTreePage() {
  const { allPersons } = usePersons();
  const { getRelationshipToUser } = useFamilyList();

  const layout = useMemo(
    () => calculateTreeLayout(allPersons || [], getRelationshipToUser),
    [allPersons, getRelationshipToUser]
  );

  if (!allPersons || allPersons.length === 0) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center border rounded-lg bg-gray-50">
        <div className="text-gray-500">No family members found.</div>
      </div>
    );
  }

  // Find "You" for initial centering
  const meId = layout.nodes.find(n => (n.relationship || '').toLowerCase() === 'you')?.id;

  return (
    <div className="w-full">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Family Tree</h2>
        <p className="text-gray-500 text-sm">Generation-wise layout. Pinch/scroll to zoom, drag to pan.</p>
      </header>
      <TreeCanvas layout={layout} centerNodeId={meId} />
    </div>
  );
}
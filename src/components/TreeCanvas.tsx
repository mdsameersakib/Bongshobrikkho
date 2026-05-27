'use client'

import React, { useRef, useMemo, useState } from 'react'
import PersonNode from './PersonNode'
import AddMemberModal from './AddMemberModal'
import EditMemberModal from './EditMemberModal'
import useTreeControls from '@/hooks/useTreeControls'
import { calculateTreeLayout } from '@/hooks/useTreeLayout'
import { usePersons, useCouples, useLineage } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { Person } from '@/types/database'
import { RelationshipFormData, PersonFormData } from '@/types/forms'

const MarriageIcon = ({ x, y }: { x: number; y: number }) => (
  <svg x={x - 8} y={y - 8} width="16" height="16" viewBox="0 0 24 24" fill="#475569" className="pointer-events-none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

export default function TreeCanvas({ userPersonId }: { userPersonId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  
  const { data: persons = [] } = usePersons()
  const { data: couples = [] } = useCouples()
  const { data: lineages = [] } = useLineage()
  const { addRelationship, updatePerson } = useFamilyMutations()

  const userPerson = useMemo(() => persons.find(p => p.id === userPersonId) || null, [persons, userPersonId])

  const layout = useMemo(() => 
    calculateTreeLayout(persons, userPerson, couples, lineages),
    [persons, userPerson, couples, lineages]
  )

  const { zoom, centerOnNode, transform, eventHandlers } = useTreeControls(
    containerRef,
    userPersonId
  )

  const handleNodeClick = (person: Person) => {
    setSelectedPerson(person)
    // For now, let's open edit modal on click, or we could have a menu
    setModalType('edit')
  }

  const handleAddMember = (person: Person) => {
    setSelectedPerson(person)
    setModalType('add')
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950 select-none"
      style={{ cursor: 'grab' }}
      {...eventHandlers}
    >
      <div
        className="absolute origin-top-left"
        style={{ 
            width: layout.width, 
            height: layout.height,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {layout.edges.map((edge) => {
            if (edge.type === 'marriage' && edge.x1 !== undefined && edge.y1 !== undefined && edge.x2 !== undefined && edge.y2 !== undefined) {
              return (
                <g key={edge.id}>
                    <line
                      x1={edge.x1} y1={edge.y1}
                      x2={edge.x2} y2={edge.y2}
                      className="stroke-slate-400 dark:stroke-slate-600 stroke-2"
                      strokeDasharray="4"
                    />
                    <MarriageIcon x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2} />
                </g>
              )
            }
            return (
              <path 
                key={edge.id} 
                d={edge.path} 
                className="fill-none stroke-slate-300 dark:stroke-slate-700 stroke-2 transition-all" 
              />
            )
          })}
        </svg>

        {layout.nodes.map((node) => (
          <div key={node.id} onClick={(e) => { e.stopPropagation(); handleNodeClick(node.person); }}>
            <PersonNode
              person={node.person}
              relationship={node.relationship}
              style={{ x: node.x, y: node.y }}
            />
            {/* Quick Add Button */}
            <button 
              className="absolute z-20 bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              style={{ left: node.x + 200, top: node.y + 70 }}
              onClick={(e) => { e.stopPropagation(); handleAddMember(node.person); }}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modalType === 'add' && selectedPerson && (
        <AddMemberModal 
          existingPerson={selectedPerson}
          onClose={() => setModalType(null)}
          onSave={async (data: RelationshipFormData) => {
            await addRelationship({ existingPersonId: selectedPerson.id, data })
            setModalType(null)
          }}
        />
      )}

      {modalType === 'edit' && selectedPerson && (
        <EditMemberModal 
          person={selectedPerson}
          onClose={() => setModalType(null)}
          onSave={async (data: PersonFormData) => {
            await updatePerson({ id: selectedPerson.id, data })
            setModalType(null)
          }}
        />
      )}

      {/* UI Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <button
            onClick={() => zoom('in')}
            className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Zoom In"
          >
            <span className="text-xl font-bold">+</span>
          </button>
          <button
            onClick={() => zoom('out')}
            className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Zoom Out"
          >
            <span className="text-xl font-bold">−</span>
          </button>
        </div>
        
        <button
          onClick={centerOnNode}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Center on Me
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {layout.nodes.length} Members • {layout.edges.length} Connections
        </div>
      </div>
    </div>
  )
}

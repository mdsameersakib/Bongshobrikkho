'use client'

import React, { useRef, useMemo, useState } from 'react'
import PersonNode from './PersonNode'
import AddMemberModal from './AddMemberModal'
import EditMemberModal from './EditMemberModal'
import useTreeControls from '@/hooks/useTreeControls'
import { calculateTreeLayout } from '@/hooks/useTreeLayout'
import { usePersons, useMarriages, useParentChild, useProfile } from '@/hooks/useFamilyData'
import { useFamilyMutations } from '@/hooks/useFamilyMutations'
import { Person } from '@/types/database'
import { RelationshipFormData, PersonFormData } from '@/types/forms'
import { Users, Network } from 'lucide-react'

const MarriageIcon = ({ x, y }: { x: number; y: number }) => (
  <svg x={x - 10} y={y - 10} width="20" height="20" viewBox="0 0 24 24" fill="#546B41" className="pointer-events-none drop-shadow-sm">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

const JunctionBall = ({ x, y }: { x: number; y: number }) => (
  <circle cx={x} cy={y} r="5" className="fill-tree-line" />
)

export default function TreeCanvas({ userPersonId }: { userPersonId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  
  const { data: profile } = useProfile()
  const { data: persons = [] } = usePersons()
  const { data: marriages = [] } = useMarriages()
  const { data: parentChild = [] } = useParentChild()
  const { addRelationship, updatePerson } = useFamilyMutations()

  const userPerson = useMemo(() => 
    persons.find(p => p.id === profile?.person_id) || null, 
    [persons, profile?.person_id]
  )

  const layout = useMemo(() => 
    calculateTreeLayout(persons, userPerson, marriages, parentChild),
    [persons, userPerson, marriages, parentChild]
  )

  const { zoom, centerOnNode, transform, eventHandlers } = useTreeControls(
    containerRef,
    userPersonId
  )

  const handleNodeClick = (person: Person) => {
    setSelectedPerson(person)
    setModalType('edit')
  }

  const handleAddMember = (person: Person) => {
    setSelectedPerson(person)
    setModalType('add')
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background/50 dark:bg-surface-alt select-none"
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
              const showHeart = edge.status === 'married';
              return (
                <g key={edge.id}>
                    <line
                      x1={edge.x1} y1={edge.y1}
                      x2={edge.x2} y2={edge.y2}
                      className="stroke-tree-line/40 stroke-2"
                      strokeDasharray={showHeart ? undefined : "4 4"}
                    />
                    {showHeart && <MarriageIcon x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2} />}
                </g>
              )
            }
            if (edge.type === 'junction-ball' && edge.x1 !== undefined && edge.y1 !== undefined) {
              return <JunctionBall key={edge.id} x={edge.x1} y={edge.y1} />
            }
            return (
              <path 
                key={edge.id} 
                d={edge.path} 
                className="fill-none stroke-tree-line stroke-2 transition-all opacity-60" 
              />
            )
          })}
        </svg>

        {layout.nodes.map((node) => (
          <div key={node.id} onClick={(e) => { e.stopPropagation(); handleNodeClick(node.person); }} className="relative group/btn">
            <PersonNode
              person={node.person}
              relationship={node.relationship}
              style={{ x: node.x, y: node.y }}
            />
            {/* Quick Add Button */}
            <button 
              className="absolute z-20 bg-forest text-cream rounded-full h-8 w-8 flex items-center justify-center shadow-xl hover:scale-110 hover:bg-sage transition-all border-2 border-cream group opacity-0 group-hover/btn:opacity-100"
              style={{ left: node.x + 220, top: node.y + 80 }}
              onClick={(e) => { e.stopPropagation(); handleAddMember(node.person); }}
              title="Add Relative"
            >
              <span className="text-xl font-black group-hover:rotate-90 transition-transform">+</span>
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedPerson && modalType === 'add' && (
        <AddMemberModal 
          existingPerson={selectedPerson}
          allPersons={persons}
          marriages={marriages}
          isUser={selectedPerson.id === userPerson?.id}
          isParentOfUser={parentChild.some(pc => pc.child_id === userPerson?.id && pc.parent_id === selectedPerson.id)}
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
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-4">
        <div className="bg-white/80 dark:bg-background/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-sand/30 dark:border-sand/10 flex flex-col gap-1.5">
          <button
            onClick={() => zoom('in')}
            className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-forest hover:text-cream text-forest dark:text-sage transition-all font-black text-2xl shadow-sm"
            title="Zoom In"
          >
            +
          </button>
          <div className="h-px bg-sand/20 mx-2" />
          <button
            onClick={() => zoom('out')}
            className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-forest hover:text-cream text-forest dark:text-sage transition-all font-black text-2xl shadow-sm"
            title="Zoom Out"
          >
            −
          </button>
        </div>
        
        <button
          onClick={centerOnNode}
          className="bg-forest text-cream backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest hover:bg-sage hover:scale-105 transition-all active:scale-95"
        >
          Center View
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/80 dark:bg-background/80 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-sand/30 dark:border-sand/10">
        <div className="text-xs font-black uppercase tracking-widest text-forest dark:text-sage flex items-center gap-3">
          <span className="flex items-center gap-1.5"><Users size={14} /> {layout.nodes.length} Members</span>
          <div className="w-1 h-1 rounded-full bg-sand" />
          <span className="flex items-center gap-1.5"><Network size={14} /> {layout.edges.length} Connections</span>
        </div>
      </div>
    </div>
  )
}

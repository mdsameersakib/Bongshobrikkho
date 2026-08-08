'use client'

import { useMemo, useRef } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import PersonNode from './PersonNode'
import useTreeControls from '@/hooks/useTreeControls'
import { calculateTreeLayout } from '@/hooks/useTreeLayout'
import { Marriage, ParentChild, Person } from '@/types/database'

const demoPerson = (id: string, firstName: string, lastName: string, gender: string, birthDate: string): Person => ({
  id,
  owner_uid: 'landing-demo',
  first_name: firstName,
  middle_name: null,
  last_name: lastName,
  gender,
  birth_date: birthDate,
  death_date: null,
  is_deceased: false,
  is_private: false,
  email: null,
  phone_number: null,
  address: null,
  country_of_residence: null,
  invite_code: null,
  created_at: null,
  updated_at: null,
})

const demoPersons: Person[] = [
  demoPerson('harun', 'Harun', 'Rahman', 'male', '1940-06-10'),
  demoPerson('salma', 'Salma', 'Rahman', 'female', '1945-03-22'),
  demoPerson('amina', 'Amina', 'Rahman', 'female', '1970-08-14'),
  demoPerson('rahim', 'Rahim', 'Khan', 'male', '1968-01-09'),
  demoPerson('farid', 'Farid', 'Rahman', 'male', '1966-02-18'),
  demoPerson('laila', 'Laila', 'Rahman', 'female', '1974-09-27'),
  demoPerson('nila', 'Nila', 'Khan', 'female', '1997-11-03'),
  demoPerson('sami', 'Sami', 'Khan', 'male', '2001-04-17'),
]

const demoMarriages: Marriage[] = [
  { id: 'harun-salma', person1_id: 'harun', person2_id: 'salma', status: 'married', start_date: null, end_date: null, created_at: null },
  { id: 'amina-rahim', person1_id: 'amina', person2_id: 'rahim', status: 'married', start_date: null, end_date: null, created_at: null },
]

const demoParentChild: ParentChild[] = [
  { id: 'harun-amina', parent_id: 'harun', child_id: 'amina', created_at: null },
  { id: 'salma-amina', parent_id: 'salma', child_id: 'amina', created_at: null },
  { id: 'harun-farid', parent_id: 'harun', child_id: 'farid', created_at: null },
  { id: 'salma-farid', parent_id: 'salma', child_id: 'farid', created_at: null },
  { id: 'harun-laila', parent_id: 'harun', child_id: 'laila', created_at: null },
  { id: 'salma-laila', parent_id: 'salma', child_id: 'laila', created_at: null },
  { id: 'amina-nila', parent_id: 'amina', child_id: 'nila', created_at: null },
  { id: 'rahim-nila', parent_id: 'rahim', child_id: 'nila', created_at: null },
  { id: 'amina-sami', parent_id: 'amina', child_id: 'sami', created_at: null },
  { id: 'rahim-sami', parent_id: 'rahim', child_id: 'sami', created_at: null },
]

export default function LandingTreeDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const layout = useMemo(() => calculateTreeLayout(demoPersons, demoPersons.find((person) => person.id === 'nila') || null, demoMarriages, demoParentChild, 140), [])
  const { zoom, centerOnNode, transform, eventHandlers } = useTreeControls(containerRef, 'nila')

  return (
    <div
      ref={containerRef}
      className="relative h-[24rem] w-full overflow-hidden rounded-[1.35rem] bg-background/65 select-none sm:h-[29rem]"
      style={{ cursor: 'grab', touchAction: 'none' }}
      {...eventHandlers}
    >
      <div
        className="absolute origin-top-left"
        style={{
          width: layout.width,
          height: layout.height + 160,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible">
          {layout.edges.map((edge) => {
            if (edge.type === 'marriage' && edge.x1 !== undefined && edge.y1 !== undefined && edge.x2 !== undefined && edge.y2 !== undefined) {
              return (
                <g key={edge.id}>
                  <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} className="stroke-tree-line/40 stroke-2" />
                  <path d={`M ${(edge.x1 + edge.x2) / 2 - 5} ${(edge.y1 + edge.y2) / 2} c -4 -5 -11 1 0 8 c 11 -7 4 -13 0 -8`} className="fill-forest dark:fill-sage" />
                </g>
              )
            }
            if (edge.type === 'junction-ball' && edge.x1 !== undefined && edge.y1 !== undefined) {
              return <circle key={edge.id} cx={edge.x1} cy={edge.y1} r="5" className="fill-tree-line" />
            }
            return <path key={edge.id} d={edge.path} className="fill-none stroke-tree-line/65 stroke-2" />
          })}
        </svg>

        {layout.nodes.map((node) => (
          <div key={node.id} className="relative">
            <PersonNode person={node.person} relationship={node.relationship} style={{ x: node.x, y: node.y }} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-full border border-sand/30 bg-white/80 p-1 shadow-lg backdrop-blur-md dark:border-sand/15 dark:bg-surface/80">
        <button type="button" onClick={() => zoom('out')} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10 dark:text-sage dark:hover:bg-sage/10"><Minus size={15} /></button>
        <button type="button" onClick={() => zoom('in')} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10 dark:text-sage dark:hover:bg-sage/10"><Plus size={15} /></button>
        <button type="button" onClick={centerOnNode} aria-label="Center tree" className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10 dark:text-sage dark:hover:bg-sage/10"><RotateCcw size={14} /></button>
      </div>
    </div>
  )
}

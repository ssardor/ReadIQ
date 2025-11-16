import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (group: any) => void
}

export const GroupCreateModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [term, setTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setIsLoading(true)
    const resp = await fetch('/api/mentor/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, term })
    })
    const json = await resp.json()
    setIsLoading(false)
    if (resp.ok) {
      onCreated(json.group)
      onClose()
      setName(''); setTerm('')
    } else {
      alert(json.message || 'Failed to create group')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create Group</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Term</label>
                <input value={term} onChange={e=>setTerm(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={submit} disabled={isLoading} className="px-4 py-2 rounded bg-primary-600 text-white">{isLoading ? 'Creating...' : 'Create'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

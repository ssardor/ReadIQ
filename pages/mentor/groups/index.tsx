import React, { useState } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { requireMentor } from '@/utils/roleGuard'
import { GroupListTable } from '@/components/GroupListTable'
import { GroupCreateModal } from '@/components/GroupCreateModal'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/BackButton'

export default function MentorGroups() {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  return (
    <>
      <Head><title>Groups - Mentor</title></Head>
      <div className="max-w-7xl mx-auto p-6">
        <BackButton href="/dashboard" className="mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Groups</h1>
          <motion.button whileTap={{ scale: .98 }} onClick={()=>setOpen(true)} className="px-4 py-2 rounded bg-primary-600 text-white">Create Group</motion.button>
        </div>
        {/* use refreshKey to force reload by remount if needed in future */}
        <GroupListTable key={refreshKey} />
      </div>
      <GroupCreateModal open={open} onClose={()=>setOpen(false)} onCreated={()=> setRefreshKey(k=>k+1)} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const res = await requireMentor(ctx)
  if ('redirect' in res) return res as any
  return { props: {} }
}

import { GetServerSidePropsContext } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

export async function requireMentor(context: GetServerSidePropsContext) {
  const accessToken = context.req.cookies['sb-access-token']
  if (!accessToken) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken)
  if (error || !user || user.user_metadata?.role !== 'mentor') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { user }
}

export async function requireStudent(context: GetServerSidePropsContext) {
  const accessToken = context.req.cookies['sb-access-token']
  if (!accessToken) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken)
  if (error || !user || user.user_metadata?.role !== 'student') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { user }
}

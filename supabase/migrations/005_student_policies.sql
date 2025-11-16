-- Student-friendly RLS policies for quiz participation

-- Allow students to view their own quiz assignments
create policy "student can view own assignments" on quiz_assignments
  for select using (student_id = auth.uid());

-- Allow students to update their own assignments (e.g., mark as completed)
create policy "student can update own assignments" on quiz_assignments
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Allow students to insert attempts for their quizzes
create policy "student can insert attempts" on attempts
  for insert with check (student_id = auth.uid());

-- Allow students to view their own attempts
create policy "student can view attempts" on attempts
  for select using (student_id = auth.uid());

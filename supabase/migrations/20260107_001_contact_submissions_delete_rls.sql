-- Add DELETE policy for contact_submissions table
-- Allows authenticated users (admins verified by middleware) to delete leads

-- ========================================
-- CONTACT_SUBMISSIONS DELETE POLICY
-- ========================================

-- Allow authenticated users to delete contact submissions
DROP POLICY IF EXISTS "Authenticated users can delete contact_submissions" ON contact_submissions;
CREATE POLICY "Authenticated users can delete contact_submissions" ON contact_submissions
  FOR DELETE TO authenticated USING (true);

COMMENT ON POLICY "Authenticated users can delete contact_submissions" ON contact_submissions IS
  'Admin access policy - allows lead deletion from admin dashboard. Users verified by Next.js middleware.';

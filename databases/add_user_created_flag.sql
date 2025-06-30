-- Add is_created_by_user column to reservations table
-- This flag indicates whether the reservation was created by a user (TRUE) or by admin (FALSE)
ALTER TABLE reservations 
ADD COLUMN is_created_by_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN reservations.is_created_by_user IS 'Flag indicating if reservation was created by user directly (TRUE) or by admin (FALSE)';
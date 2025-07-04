-- Add email column to admin table for password reset functionality
ALTER TABLE admins ADD COLUMN email VARCHAR(255) UNIQUE;

-- Add index for email column for efficient lookups
CREATE INDEX idx_admins_email ON admins(email);

-- Add comment to document the purpose
COMMENT ON COLUMN admins.email IS 'Email address for admin account, used for password reset functionality';
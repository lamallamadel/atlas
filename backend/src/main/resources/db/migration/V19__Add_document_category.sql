-- Add category column to document table for document categorization
ALTER TABLE document ADD COLUMN category VARCHAR(100);

-- Create index on category for filtering
CREATE INDEX idx_document_category ON document(category);



CREATE TABLE comment_thread (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    title VARCHAR(500),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    org_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE comment (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    mentions_json JSONB,
    org_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_comment_thread FOREIGN KEY (thread_id) REFERENCES comment_thread(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_thread_entity ON comment_thread(entity_type, entity_id);
CREATE INDEX idx_comment_thread_org_id ON comment_thread(org_id);
CREATE INDEX idx_comment_thread_resolved ON comment_thread(resolved);
CREATE INDEX idx_comment_thread_id ON comment(thread_id);
CREATE INDEX idx_comment_org_id ON comment(org_id);
CREATE INDEX idx_comment_created_at ON comment(created_at);

CREATE INDEX idx_comment_content_fulltext ON comment USING gin(to_tsvector('french', content));

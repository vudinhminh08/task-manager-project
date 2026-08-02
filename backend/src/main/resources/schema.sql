CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_email_normalized
        CHECK (email = lower(btrim(email)))
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(11) NOT NULL,
    priority VARCHAR(6) NOT NULL,
    category VARCHAR(50) NOT NULL,
    due_date DATE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tasks_status
        CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT ck_tasks_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_tasks_title
        CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 120),
    CONSTRAINT ck_tasks_category
        CHECK (
            category = btrim(category)
            AND category IN (
                'STUDY', 'WORK', 'PERSONAL', 'FAMILY', 'HEALTH',
                'FINANCE', 'SHOPPING', 'PROJECT', 'PLANNING',
                'HOME', 'ENTERTAINMENT', 'OTHER'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_created_id
    ON tasks (user_id, created_at DESC, id DESC);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Run once on an existing local/production PostgreSQL database.
-- The application must be deployed with the new frontend/backend before adding
-- the strict constraint, so old records can still be displayed during rollout.

BEGIN;

UPDATE tasks
SET category = CASE category
    WHEN 'Học tập' THEN 'STUDY'
    WHEN 'Công việc' THEN 'WORK'
    WHEN 'Cá nhân' THEN 'PERSONAL'
    WHEN 'Gia đình' THEN 'FAMILY'
    WHEN 'Sức khỏe' THEN 'HEALTH'
    WHEN 'Tài chính' THEN 'FINANCE'
    WHEN 'Mua sắm' THEN 'SHOPPING'
    WHEN 'Dự án' THEN 'PROJECT'
    WHEN 'Kế hoạch' THEN 'PLANNING'
    WHEN 'Việc nhà' THEN 'HOME'
    WHEN 'Giải trí' THEN 'ENTERTAINMENT'
    WHEN 'Khác' THEN 'OTHER'
    ELSE category
END;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM tasks
        WHERE category NOT IN (
            'STUDY', 'WORK', 'PERSONAL', 'FAMILY', 'HEALTH',
            'FINANCE', 'SHOPPING', 'PROJECT', 'PLANNING',
            'HOME', 'ENTERTAINMENT', 'OTHER'
        )
    ) THEN
        RAISE EXCEPTION 'Unknown task category remains after migration';
    END IF;
END $$;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS ck_tasks_category;
ALTER TABLE tasks ADD CONSTRAINT ck_tasks_category CHECK (
    category = btrim(category)
    AND category IN (
        'STUDY', 'WORK', 'PERSONAL', 'FAMILY', 'HEALTH',
        'FINANCE', 'SHOPPING', 'PROJECT', 'PLANNING',
        'HOME', 'ENTERTAINMENT', 'OTHER'
    )
);

COMMIT;

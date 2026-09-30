-- ============================================
-- DEMO DATA FOR RAHTI / POSTGRESQL
-- Safe to run multiple times
-- ============================================


-- ============================================
-- RESERVATION STATUSES
-- ============================================

INSERT INTO r_status (name) VALUES
    ('PENDING'),
    ('CONFIRMED'),
    ('CANCELLED'),
    ('COMPLETED')
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- TABLE STATUSES
-- ============================================

INSERT INTO t_status (name) VALUES
    ('AVAILABLE'),
    ('RESERVED'),
    ('OCCUPIED'),
    ('OUT_OF_SERVICE')
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- DEMO CUSTOMERS
-- ============================================

INSERT INTO customers (firstname, lastname, email)
SELECT 'John', 'Doe', 'john@mail.fi'
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'john@mail.fi'
);

INSERT INTO customers (firstname, lastname, email)
SELECT 'Jane', 'Doe', 'jane@mail.fi'
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'jane@mail.fi'
);


-- ============================================
-- DEMO RESERVATION FOR JOHN
-- ============================================

INSERT INTO reservations (
    edit_token,
    customer_id,
    datetime,
    starttime,
    endtime,
    party_size,
    details,
    rstatus_id
)
SELECT
    'demo-john-birthday',
    c.customer_id,
    CURRENT_TIMESTAMP,
    '18:00:00',
    '20:00:00',
    4,
    'Birthday dinner reservation. Window seat preferred.',
    s.rstatus_id
FROM customers c
CROSS JOIN r_status s
WHERE c.email = 'john@mail.fi'
  AND s.name = 'PENDING'
ON CONFLICT (edit_token) DO NOTHING;


-- ============================================
-- DEMO RESERVATION FOR JANE
-- ============================================

INSERT INTO reservations (
    edit_token,
    customer_id,
    datetime,
    starttime,
    endtime,
    party_size,
    details,
    rstatus_id
)
SELECT
    'demo-jane-anniversary',
    c.customer_id,
    CURRENT_TIMESTAMP,
    '10:00:00',
    '12:00:00',
    2,
    'Anniversary.',
    s.rstatus_id
FROM customers c
CROSS JOIN r_status s
WHERE c.email = 'jane@mail.fi'
  AND s.name = 'CONFIRMED'
ON CONFLICT (edit_token) DO NOTHING;
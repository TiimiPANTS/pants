-- ============================================
-- DEMO DATA FOR RAHTI / POSTGRESQL
-- Safe to run multiple times
-- ============================================


-- Reservation statuses

INSERT INTO r_status (name) VALUES
('PENDING'),
('CONFIRMED'),
('CANCELLED'),
('COMPLETED')
ON CONFLICT (name) DO NOTHING;


-- Table statuses

INSERT INTO t_status (name) VALUES
('AVAILABLE'),
('RESERVED'),
('OCCUPIED'),
('OUT_OF_SERVICE')
ON CONFLICT (name) DO NOTHING;


-- Demo customers

INSERT INTO customers (firstname, lastname, email) VALUES
('John', 'Doe', 'john@mail.fi'),
('Jane', 'Doe', 'jane@mail.fi')
ON CONFLICT (email) DO NOTHING;


-- Demo reservation for John

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


-- Demo reservation for Jane

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
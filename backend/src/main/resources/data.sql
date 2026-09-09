INSERT INTO CUSTOMERS (firstname, lastname, email) VALUES
('John', 'Doe', 'john@mail.fi')
,('Jane', 'Doe', 'jane@mail.fi');


INSERT INTO R_STATUS (name) VALUES
('PENDING')
,('CONFIRMED')
,('CANCELLED')
,('COMPLETED');

INSERT INTO T_STATUS (name) VALUES
('AVAILABLE')
,('RESERVED')
,('OCCUPIED')
,('OUT_OF_SERVICE');

INSERT INTO RESERVATIONS (customer_id, datetime, starttime, endtime, party_size, details, rstatus_id) VALUES 
(1, CURRENT_TIMESTAMP, '18:00:00', '20:00:00', 4, 'Birthday dinner reservation. Window seat preferred.', 1)
,(2, CURRENT_TIMESTAMP, '10:00:00', '12:00:00', 2, 'Anniversary.', 2);
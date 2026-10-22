CREATE TABLE customers (
    customer_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL,

    CONSTRAINT pk_customers
        PRIMARY KEY (customer_id),
    CONSTRAINT chk_customers_firstname
        CHECK (
            char_length(btrim(firstname, E' \t\n\r\f')) BETWEEN 2 AND 50
            AND btrim(firstname, E' \t\n\r\f') ~ $regex$^[[:alpha:] '-]+$$regex$
        ),
    CONSTRAINT chk_customers_lastname
        CHECK (
            char_length(btrim(lastname, E' \t\n\r\f')) BETWEEN 2 AND 50
            AND btrim(lastname, E' \t\n\r\f') ~ $regex$^[[:alpha:] '-]+$$regex$
        ),
    CONSTRAINT chk_customers_email
        CHECK (
            btrim(email, E' \t\n\r\f')
            ~ $regex$^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$$regex$
        )
);

CREATE TABLE r_status (
    rstatus_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50) NOT NULL,

    CONSTRAINT pk_r_status
        PRIMARY KEY (rstatus_id),
    CONSTRAINT uq_r_status_name
        UNIQUE (name)
);

CREATE TABLE t_status (
    tstatus_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50) NOT NULL,

    CONSTRAINT pk_t_status
        PRIMARY KEY (tstatus_id),
    CONSTRAINT uq_t_status_name
        UNIQUE (name)
);

CREATE TABLE roles (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50) NOT NULL,

    CONSTRAINT pk_roles
        PRIMARY KEY (role_id),
    CONSTRAINT uq_roles_name
        UNIQUE (name)
);

CREATE TABLE reservations (
    reservation_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    edit_token VARCHAR(64) UNIQUE,
    customer_id INTEGER NOT NULL,
    starttime TIME NOT NULL,
    endtime TIME,
    datetime TIMESTAMP NOT NULL,
    party_size INTEGER NOT NULL,
    details TEXT,
    rstatus_id INTEGER NOT NULL,

    CONSTRAINT pk_reservations
        PRIMARY KEY (reservation_id),

    CONSTRAINT fk_reservations_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_reservations_status
        FOREIGN KEY (rstatus_id)
        REFERENCES r_status(rstatus_id),

    CONSTRAINT chk_reservations_time_order
        CHECK (endtime IS NULL OR endtime >= starttime),

    CONSTRAINT chk_reservations_party_size
        CHECK (party_size BETWEEN 1 AND 10)
);


CREATE TABLE tables (
    table_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    table_number INTEGER,
    capacity INTEGER,
    tstatus_id INTEGER,

    CONSTRAINT pk_tables
        PRIMARY KEY (table_id),

    CONSTRAINT fk_tables_status
        FOREIGN KEY (tstatus_id)
        REFERENCES t_status(tstatus_id)
);


CREATE TABLE tablelist (
    table_id INTEGER NOT NULL,
    reservation_id INTEGER NOT NULL,

    CONSTRAINT pk_tablelist
        PRIMARY KEY (table_id, reservation_id),

    CONSTRAINT fk_tablelist_table
        FOREIGN KEY (table_id)
        REFERENCES tables(table_id),

    CONSTRAINT fk_tablelist_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id)
);


CREATE TABLE receipts (
    receipt_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    reservation_id INTEGER NOT NULL,
    issued TIMESTAMP,

    CONSTRAINT pk_receipts
        PRIMARY KEY (receipt_id),

    CONSTRAINT fk_receipts_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id),

    CONSTRAINT uq_receipts_reservation
        UNIQUE (reservation_id)
);


CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    passwordhash VARCHAR(255),
    role_id INTEGER,

    CONSTRAINT pk_users
        PRIMARY KEY (user_id),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);

CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_reservations_rstatus_id ON reservations(rstatus_id);
CREATE INDEX idx_tables_tstatus_id ON tables(tstatus_id);
CREATE INDEX idx_tablelist_reservation_id ON tablelist(reservation_id);
CREATE INDEX idx_users_role_id ON users(role_id);

-- INSERT
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

INSERT INTO ROLES (name) VALUES
('ADMIN')
,('OWNER')
,('EMPLOYEE');

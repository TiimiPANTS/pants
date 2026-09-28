CREATE TABLE customers (
    customer_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(255),

    CONSTRAINT pk_customers
        PRIMARY KEY (customer_id)
);

CREATE TABLE r_status (
    rstatus_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50),

    CONSTRAINT pk_r_status
        PRIMARY KEY (rstatus_id)
);

CREATE TABLE t_status (
    tstatus_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50),

    CONSTRAINT pk_t_status
        PRIMARY KEY (tstatus_id)
);

CREATE TABLE roles (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    name VARCHAR(50),

    CONSTRAINT pk_roles
        PRIMARY KEY (role_id)
);


CREATE TABLE reservations (
    reservation_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    customer_id INTEGER NOT NULL,
    starttime TIME,
    endtime TIME,
    datetime TIMESTAMP,
    party_size INTEGER,
    details TEXT,
    status_id INTEGER,

    CONSTRAINT pk_reservations
        PRIMARY KEY (reservation_id),

    CONSTRAINT fk_reservations_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_reservations_status
        FOREIGN KEY (status_id)
        REFERENCES r_status(rstatus_id)
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


CREATE TABLE receipt (
    receipt_id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    reservation_id INTEGER NOT NULL,
    issued TIMESTAMP,

    CONSTRAINT pk_receipt
        PRIMARY KEY (receipt_id),

    CONSTRAINT fk_receipt_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id),

    CONSTRAINT uq_receipt_reservation
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
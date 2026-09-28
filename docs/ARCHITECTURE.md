Piirretään projektin arkkitehtuuri diagrammi lopussa. Voidaan selittää se täällä auki ja lisää kaikki suoraan README.md

- Tree directory eli puukaavio, tullaan lisäämään myöhemmin.
- Mietitään luokkakaavion ja relaatiokaavio sijoittelua + tietohakemisto
- Demovideo linkki?
- Deployment link?

# Class Diagram
![classDiagram](assets/classDiagram.png)

# ER diagram
![ERD](assets/ERD.png)


# Data Dictionary

This data dictionary is based on the provided ER diagram.

## 1. CUSTOMERS

Stores customer information. One customer can have one or more reservations.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `customer_id` | INT | PK | Unique identifier for each customer |
| `firstname` | VARCHAR(100) | | Customer's first name |
| `lastname` | VARCHAR(100) | | Customer's last name |
| `email` | VARCHAR(255) | | Customer's email address |

## 2. RESERVATIONS

Stores restaurant reservations made by customers.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `reservation_id` | INT | PK | Unique identifier for each reservation |
| `customer_id` | INT | FK | References `CUSTOMERS.customer_id` |
| `starttime` | TIME | | Starting time of the reservation |
| `endtime` | TIME | | Ending time of the reservation |
| `datetime` | DATETIME | | Date/time associated with the reservation |
| `party_size` | INT | | Number of guests in the reservation |
| `details` | TEXT | | Additional reservation details or notes |
| `status_id` | INT | FK | References `R_STATUS.rstatus_id` |

### Relationships

- Each reservation belongs to 1 customer.
- Each customer has 1 or more reservations according to the diagram.
- Each reservation has 1 reservation status.
- One reservation can be associated with 1 or more tables through `TABLELIST`.
- A reservation can have 0 or 1 receipt.

## 3. RECEIPT

Stores receipt information related to reservations.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `receipt_id` | INT | PK | Unique identifier for each receipt |
| `reservation_id` | INT | FK | References `RESERVATIONS.reservation_id` |
| `issued` | DATETIME | | Date/time when the receipt was issued |

**Relationship:** A reservation can have 0 or 1 receipt, while each receipt is associated with 1 reservation.

## 4. TABLES

Stores information about physical restaurant tables.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `table_id` | INT | PK | Unique identifier for each table |
| `table_number` | INT | | Restaurant's visible/assigned table number |
| `capacity` | INT | | Maximum number of guests the table can accommodate |
| `tstatus_id` | INT | FK | References `T_STATUS.tstatus_id` |

### Relationships

- Each table has 1 table status.
- A table can appear in 0 or more `TABLELIST` records.

## 5. TABLELIST

Junction/associative table connecting reservations and restaurant tables. This resolves the many-to-many relationship between reservations and tables.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `table_id` | INT | PK, FK | References `TABLES.table_id` |
| `reservation_id` | INT | PK, FK | References `RESERVATIONS.reservation_id` |

### Composite Primary Key

The primary key is `(table_id, reservation_id)`. This prevents the same table from being assigned to the same reservation more than once.

## 6. R_STATUS

Lookup table containing possible reservation statuses.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `rstatus_id` | INT | PK | Unique identifier for a reservation status |
| `name` | VARCHAR(50) | | Name of the reservation status |

Possible values might include `Pending`, `Confirmed`, `Cancelled`, or `Completed`, but these values are not specified in the diagram.

## 7. T_STATUS

Lookup table containing possible statuses for restaurant tables.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `tstatus_id` | INT | PK | Unique identifier for a table status |
| `name` | VARCHAR(50) | | Name of the table status |

Possible values might include `Available`, `Occupied`, or `Unavailable`, but these values are not specified in the diagram.

## 8. USERS

Stores application user and login information.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `user_id` | INT | PK | Unique identifier for each application user |
| `username` | VARCHAR(100) | | User's login name |
| `email` | VARCHAR(255) | | User's email address |
| `passwordhash` | VARCHAR(255) | | Hashed representation of the user's password |
| `role_id` | INT | FK | References `ROLES.role_id` |

**Relationship:** Each user belongs to 1 role, while one role can be associated with 0 or more users.

## 9. ROLES

Lookup table containing application user roles.

| Field | Suggested Data Type | Key | Description |
|---|---|---|---|
| `role_id` | INT | PK | Unique identifier for each role |
| `name` | VARCHAR(50) | | Name of the role |

Possible role values might include `Admin`, `Manager`, or `Staff`, but the diagram does not define the actual values.

# Relationship Summary

| Parent | Child / Junction | Relationship |
|---|---|---|
| `CUSTOMERS` | `RESERVATIONS` | 1 : 1..* |
| `R_STATUS` | `RESERVATIONS` | 1 : 0..* |
| `RESERVATIONS` | `RECEIPT` | 1 : 0..1 |
| `RESERVATIONS` | `TABLELIST` | 1 : 1..* |
| `TABLES` | `TABLELIST` | 1 : 0..* |
| `T_STATUS` | `TABLES` | 1 : 0..* |
| `ROLES` | `USERS` | 1 : 0..* |

# Overall Structure

The database contains **9 tables** and supports three main areas:

1. **Reservation management:** `CUSTOMERS` -> `RESERVATIONS` -> `RECEIPT`
2. **Table management:** `RESERVATIONS` <-> `TABLELIST` <-> `TABLES`, with `R_STATUS` and `T_STATUS` providing status values
3. **User management:** `ROLES` -> `USERS`

# Notes

- **PK** = Primary Key
- **FK** = Foreign Key
- Field names and key relationships come from the provided ER diagram.
- Data types, field lengths, and example lookup values are recommendations because those details are not shown in the diagram.
- `TABLELIST` uses a composite primary key because both `table_id` and `reservation_id` are marked `pk, fk` in the diagram.

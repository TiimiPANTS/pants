// Accessible names of UI elements used in the e2e tests.
export const ROUTES = {
    reserve: '/reserve',
    editReservation: (token: string) => `/reserve/${token}`,
} as const;

export const BUTTONS = {
    nextMonth: '›',
    increaseGuests: '+',
    decreaseGuests: '−',
    confirmReservation: 'Confirm Reservation',
    updateReservation: 'Update Reservation',
    editReservation: 'Edit Reservation',
} as const;

export const HEADINGS = {
    editReservation: 'Edit your reservation',
    reservationConfirmed: 'Reservation Confirmed!',
} as const;

export const TEXTBOXES = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    specialRequests: 'Special Requests',
} as const;

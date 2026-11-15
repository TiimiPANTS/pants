
import {
    formatEuropeanDate,
    type ReservationForm,
    type ReservationTime,
} from "../types/reservation";

// Calculate reservation end time based on a two hour duration
const calculateEndTime = (startTime: ReservationTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = (hours + 2) % 24;

    return `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Build the reservation payload to be sent to the backend
export const createReservationData = (
    form: ReservationForm,
    selectedDay: Date,
    selectedTime: ReservationTime,
    guestCount: number
) => {

    // Combine the selected date and time into the expected format
    const datetime = `${formatEuropeanDate(selectedDay)} ${selectedTime}`;

    return {
        customer: {
            //Remove surrounding whitespaces before saving customer details
            firstname: form.firstName.trim(),
            lastname: form.lastName.trim(),
            email: form.email.trim(),
        },
        datetime,
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime),
        partySize: guestCount,
        details: form.specialRequests,
    };
};

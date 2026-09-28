import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
    availableTimes,
    type ReservationForm,
    type ReservationTime,
} from "../types/reservation";

const API_URL = "http://localhost:8080/api";

const emptyForm: ReservationForm = {
    firstName: "",
    lastName: "",
    email: "",
    specialRequests: "",
};

// Pass an edit token to load an existing reservation and update it instead of creating a new one
export function useReservation(token?: string) {
    const isEditMode = Boolean(token);

    const [selectedDay, setSelectedDay] = useState<Date | undefined>(
        new Date()
    );
    const [selectedTime, setSelectedTime] = useState<ReservationTime>("19:30");
    const [guestCount, setGuestCount] = useState<number>(2);

    const [form, setForm] = useState<ReservationForm>(emptyForm);

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            return;
        }

        const loadReservation = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/reservations/manage/${token}`
                );

                if (!response.ok) {
                    throw new Error("Reservation not found.");
                }

                const reservation = await response.json();

                setSelectedDay(new Date(reservation.datetime));

                const time = reservation.startTime.substring(0, 5);
                if ((availableTimes as readonly string[]).includes(time)) {
                    setSelectedTime(time as ReservationTime);
                }

                setGuestCount(reservation.partySize);

                setForm({
                    firstName: reservation.customer.firstname,
                    lastName: reservation.customer.lastname,
                    email: reservation.customer.email,
                    specialRequests: reservation.details ?? "",
                });
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load reservation."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadReservation();
    }, [token]);

    const updateGuestCount = (value: number) => {
        const safeValue = Number.isNaN(value)
            ? 2
            : Math.min(10, Math.max(1, value));

        setGuestCount(safeValue);
    };

    const handleGuestChange = (event: ChangeEvent<HTMLInputElement>) => {
        updateGuestCount(Number.parseInt(event.target.value, 10));
    };

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const calculateEndTime = (startTime: ReservationTime) => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const endHours = (hours + 2) % 24;

        return `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:00`;
    };

    const handleSubmit = async () => {
        setError(null);
        setMessage(null);

        if (!selectedDay) {
            setError("Please select a date.");
            return;
        }

        setIsSubmitting(true);

        const datetime =
            `${selectedDay.getFullYear()}-` +
            `${String(selectedDay.getMonth() + 1).padStart(2, "0")}-` +
            `${String(selectedDay.getDate()).padStart(2, "0")}` +
            `T${selectedTime}:00`;

        const reservationData = {
            customer: {
                firstname: form.firstName,
                lastname: form.lastName,
                email: form.email,
            },
            datetime,
            startTime: `${selectedTime}:00`,
            endTime: calculateEndTime(selectedTime),
            partySize: guestCount,
            details: form.specialRequests,
        };

        try {
            const response = await fetch(
                isEditMode
                    ? `${API_URL}/reservations/manage/${token}`
                    : `${API_URL}/reservations`,
                {
                    method: isEditMode ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(reservationData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message ||
                    `Reservation failed: ${response.status}`
                );
            }

            const savedReservation = await response.json();

            if (!isEditMode) {
                const receiptResponse = await fetch(
                    `${API_URL}/receipts/${savedReservation.reservationId}`,
                    {
                        method: "POST",
                    }
                );

                if (!receiptResponse.ok) {
                    throw new Error("Receipt creation failed");
                }

                setForm(emptyForm);
                setGuestCount(2);
            }

            setMessage(
                isEditMode
                    ? "Reservation updated successfully!"
                    : "Reservation created successfully!"
            );

            return savedReservation;
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to save reservation.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isEditMode,
        isLoading,
        selectedDay,
        setSelectedDay,
        selectedTime,
        setSelectedTime,
        guestCount,
        updateGuestCount,
        form,
        isSubmitting,
        error,
        message,
        handleGuestChange,
        handleInputChange,
        handleSubmit,
    };
}

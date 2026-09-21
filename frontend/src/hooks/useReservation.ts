import { useState } from "react";
import type { ChangeEvent } from "react";
import type { ReservationForm, ReservationTime } from "../types/reservation";

export function useReservation() {
    const [selectedDay, setSelectedDay] = useState<number>(21);
    const [selectedTime, setSelectedTime] = useState<ReservationTime>("19:30");
    const [guestCount, setGuestCount] = useState<number>(2);

    const [form, setForm] = useState<ReservationForm>({
        firstName: "",
        lastName: "",
        email: "",
        specialRequests: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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
        setIsSubmitting(true);

        const reservationData = {
            customer: {
                firstname: form.firstName,
                lastname: form.lastName,
                email: form.email,
            },
            datetime: `2026-09-${String(selectedDay).padStart(
                2,
                "0"
            )}T${selectedTime}:00`,
            startTime: `${selectedTime}:00`,
            endTime: calculateEndTime(selectedTime),
            partySize: guestCount,
            details: form.specialRequests,
        };

        try {
            const response = await fetch("http://localhost:8080/api/reservations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reservationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || `Reservation failed: ${response.status}`
                );
            }

            const createdReservation = await response.json();
            const receiptResponse = await fetch(
                `http://localhost:8080/api/receipts/${createdReservation.reservationId}`,
                {
                    method: "POST",
                }
            );

            if (!receiptResponse.ok) {
                throw new Error("Receipt creation failed");
            }

            setMessage("Reservation created successfully!");
            setForm({
                firstName: "",
                lastName: "",
                email: "",
                specialRequests: "",
            });
            setGuestCount(2);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to create reservation.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
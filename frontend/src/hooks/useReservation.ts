import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    formatDateKey,
    formatEuropeanDate,
    getAvailableTimes,
    parseEuropeanDate,
    type ReservationAvailability,
    type ReservationForm,
    type ReservationTime,
} from "../types/reservation";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Parse a JSON body without throwing on empty/non-JSON responses
async function readJson(response: Response) {
    const text = await response.text();
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const emptyForm: ReservationForm = {
    firstName: "",
    lastName: "",
    email: "",
    specialRequests: "",
};

type ValidationErrors = {
    firstName?: string;
    lastName?: string;
    email?: string;
}


// Pass an edit token to load an existing reservation and update it instead of creating a new one
export function useReservation(token?: string) {
    const isEditMode = Boolean(token);

    const [selectedDay, setSelectedDay] = useState<Date | undefined>(
        undefined
    );
    const [selectedTime, setSelectedTime] = useState<ReservationTime | undefined>(undefined);
    const [guestCount, setGuestCount] = useState<number>(2);

    const [form, setForm] = useState<ReservationForm>(emptyForm);

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = 
        useState<ValidationErrors>({});
    const [message, setMessage] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [availability, setAvailability] = useState<ReservationAvailability[]>([]);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [originalReservationSlot, setOriginalReservationSlot] = useState<{
        date: string;
        time: ReservationTime;
    } | null>(null);
    const availabilityRequestId = useRef(0);

    const loadAvailability = useCallback(async (month: Date = new Date()) => {
        const requestId = ++availabilityRequestId.current;
        const from = new Date(month.getFullYear(), month.getMonth(), 1);
        const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const query = new URLSearchParams({
            from: formatDateKey(from),
            to: formatDateKey(to),
        });
        setIsAvailabilityLoading(true);
        setAvailability([]);
        setAvailabilityError(null);

        try {
            const response = await fetch(
                `${API_URL}/reservations/availability?${query.toString()}`
            );
            if (!response.ok) {
                throw new Error(`Unable to load availability (${response.status}).`);
            }

            const reservations = await readJson(response);
            if (
                !Array.isArray(reservations) ||
                reservations.some(
                    (reservation) =>
                        typeof reservation?.date !== "string" ||
                        typeof reservation?.startTime !== "string" ||
                        typeof reservation?.availableCapacity !== "number"
                )
            ) {
                throw new Error("The availability response was invalid.");
            }

            if (requestId === availabilityRequestId.current) {
                setAvailability(reservations);
                setAvailabilityError(null);
            }
        } catch (error) {
            if (requestId === availabilityRequestId.current) {
                setAvailabilityError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load reservation availability."
                );
            }
        } finally {
            if (requestId === availabilityRequestId.current) {
                setIsAvailabilityLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            if (active) {
                void loadAvailability(new Date());
            }
        });

        return () => {
            active = false;
        };
    }, [loadAvailability]);

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

                const reservation = await readJson(response);
                if (!reservation) {
                    throw new Error("Reservation not found.");
                }

                if (reservation.status?.name === "CANCELLED") {   
                    setIsCancelled(true);                         
                }                                                 

                const reservationDate = parseEuropeanDate(reservation.datetime);
                setSelectedDay(reservationDate);

                const time = reservation.startTime.substring(0, 5);
                const availableTimes = getAvailableTimes(reservationDate);

                if (availableTimes.includes(time)) {
                    setSelectedTime(time);
                    setOriginalReservationSlot({
                        date: formatDateKey(reservationDate),
                        time,
                    });
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

    const slotAvailableCapacities = useMemo(() => {
        const capacities = new Map<ReservationTime, number>();
        if (!selectedDay) {
            return capacities;
        }

        const date = formatDateKey(selectedDay);
        for (const reservation of availability) {
            const time = reservation.startTime.substring(0, 5);
            if (reservation.date === date) {
                capacities.set(
                    time,
                    Math.min(
                        capacities.get(time) ?? Number.POSITIVE_INFINITY,
                        reservation.availableCapacity
                    )
                );
            }
        }
        return capacities;
    }, [availability, selectedDay]);

    const bookedDates = useMemo(() => {
        const capacitiesByDateAndTime = new Map<string, Map<string, number>>();
        for (const reservation of availability) {
            const capacitiesByTime =
                capacitiesByDateAndTime.get(reservation.date) ?? new Map<string, number>();
            const time = reservation.startTime.substring(0, 5);
            capacitiesByTime.set(
                time,
                Math.min(capacitiesByTime.get(time) ?? Number.POSITIVE_INFINITY,
                    reservation.availableCapacity)
            );
            capacitiesByDateAndTime.set(reservation.date, capacitiesByTime);
        }

        return Array.from(capacitiesByDateAndTime.entries())
            .filter(([date, capacitiesByTime]) => {
                const [year, month, day] = date.split("-").map(Number);
                const dateValue = new Date(year, month - 1, day);
                const times = getAvailableTimes(dateValue);
                const noCapacity = times.every(
                    (time) => (capacitiesByTime.get(time) ?? 0) < 1
                );
                return (
                    originalReservationSlot?.date !== date &&
                    times.length > 0 &&
                    noCapacity
                );
            })
            .map(([date]) => {
                const [year, month, day] = date.split("-").map(Number);
                return new Date(year, month - 1, day);
            });
    }, [availability, originalReservationSlot]);

    const currentReservationTime =
        originalReservationSlot &&
        selectedDay &&
        originalReservationSlot.date === formatDateKey(selectedDay)
            ? originalReservationSlot.time
            : undefined;
    const getRemainingCapacity = (time: ReservationTime) =>
        slotAvailableCapacities.get(time) ?? 0;

    const selectDay = (date: Date) => {
        if (!selectedDay || formatDateKey(date) !== formatDateKey(selectedDay)) {
            setSelectedTime(undefined);
        }
        setSelectedDay(date);
    };

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
        )}`;
    };

    const handleSubmit = async () => {
        setError(null);
        setMessage(null);

        if (isAvailabilityLoading || availabilityError) {
            setError("Reservation availability is unavailable. Please try again.");
            return;
        }
        if (!selectedDay) {
            setError("Please select a date.");
            return;
        }
        if (!selectedTime) {
            setError("Please select a time.")
            return;
        }
        if (
            getRemainingCapacity(selectedTime) < guestCount &&
            selectedTime !== currentReservationTime
        ) {
            setError("There is not enough capacity at that time. Please choose another time or reduce your party size.");
            return;
        }

        const errors: ValidationErrors = {};

        const namePattern = /^[\p{L} '-]+$/u;

        if (!form.firstName.trim()) {
            errors.firstName = "First name is required.";
        } else if (form.firstName.trim().length < 2) {
            errors.firstName = "First name must be at least 2 characters.";
        } else if (form.firstName.trim().length > 50) {
            errors.firstName = "First name must be 50 characters or less.";
        } else if (!namePattern.test(form.firstName.trim())) {
            errors.firstName =
                "First name can only contain letter"
        }

        if (!form.lastName.trim()) {
            errors.lastName = "Last name is required.";
        } else if (form.lastName.trim().length < 2) {
            errors.lastName = "Last name must be at least 2 characters.";
        } else if (form.lastName.trim().length > 50) {
            errors.lastName = "Last name must be 50 characters or less.";
        } else if (!namePattern.test(form.lastName.trim())) {
            errors.lastName =
                "Last name can only contain letter"
        }

        if (!form.email.trim()) {
            errors.email = "Email is required.";
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(form.email.trim())) {
                errors.email = "Enter an email like name@example.com";
            }

    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
        return;
    }

        setIsSubmitting(true);

        const datetime = `${formatEuropeanDate(selectedDay)} ${selectedTime}`;

        const reservationData = {
            customer: {
                firstname: form.firstName,
                lastname: form.lastName,
                email: form.email,
            },
            datetime,
            startTime: selectedTime,
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
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(reservationData),
                }
            );

            if (!response.ok) {
                const errorData = await readJson(response);
                throw new Error(
                    errorData?.message ||
                    `Reservation failed: ${response.status}`
                );
            }

            const savedReservation = await readJson(response);
            if (!savedReservation) {
                throw new Error(
                    `Unexpected empty response from server (${response.status})`
                );
            }

            if (!isEditMode) {
                const receiptResponse = await fetch(
                    `${API_URL}/receipts/${savedReservation.reservationId}`,
                    {
                        method: "POST",
                        headers: {
                            "X-Reservation-Token": savedReservation.editToken,
                        },
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
            void loadAvailability(selectedDay);

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

        const handleCancel = async () => {
        if (!token) {
            return false;
        }

        setError(null);
        setMessage(null);
        setIsCancelling(true);

        try {
            const response = await fetch(
                `${API_URL}/reservations/manage/${token}/cancel`,
                {
                    method: "PATCH",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await readJson(response);
                throw new Error(
                    errorData?.message ||
                    `Cancellation failed: ${response.status}`
                );
            }

            setIsCancelled(true);
            setMessage("Your reservation has been cancelled.");
            return true;
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to cancel reservation."
            );
            return false;
        } finally {
            setIsCancelling(false);
        }
    };



    return {
        isEditMode,
        isLoading,
        selectedDay,
        selectDay,
        selectedTime,
        setSelectedTime,
        slotAvailableCapacities,
        currentReservationTime,
        bookedDates,
        isAvailabilityLoading,
        availabilityError,
        refreshAvailability: loadAvailability,
        guestCount,
        updateGuestCount,
        form,
        isSubmitting,
        error,
        validationErrors,
        message,
        handleGuestChange,
        handleInputChange,
        handleSubmit,
        isCancelling,
        isCancelled,
        handleCancel,
    };
}

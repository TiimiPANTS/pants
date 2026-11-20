import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { getCsrfHeaders } from "./csrf";
import {
    formatDateKey,
    getAvailableTimes,
    MAX_PARTY_SIZE,
    MIN_PARTY_SIZE,
    parseEuropeanDate,
    type ReservationAvailability,
    type ReservationForm,
    type ReservationTime,
} from "../types/reservation";

import {
    validateReservationForm,
    type ValidationErrors,
} from "../utils/reservationValidation";

import { createReservationData } from "../utils/reservationData";


const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;
const AVAILABILITY_REFRESH_MS = 30000;

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

// Pass an edit token to load an existing reservation and update it instead of creating a new one
export function useReservation(token?: string, reservationId?:string) {
    const isStaffEdit = Boolean(reservationId);
    const isEditMode = Boolean(token) || isStaffEdit;

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

    const availabilityMonthRef = useRef<Date>(new Date());

    const loadAvailability = useCallback(async (
        month: Date = new Date(),
        silent: boolean = false
    ) => {
        const requestId = ++availabilityRequestId.current;
        const from = new Date(month.getFullYear(), month.getMonth(), 1);
        const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const query = new URLSearchParams({
            from: formatDateKey(from),
            to: formatDateKey(to),
        });
        if (!silent) {
            availabilityMonthRef.current = month;
            setIsAvailabilityLoading(true);
            setAvailability([]);
            setAvailabilityError(null);
        }

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
            if (requestId === availabilityRequestId.current && !silent) {
                setAvailabilityError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load reservation availability."
                );
            }
        } finally {
            if (requestId === availabilityRequestId.current && !silent) {
                setIsAvailabilityLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const refreshQuietly = () => {
            if (document.visibilityState === "visible") {
                void loadAvailability(availabilityMonthRef.current, true);
            }
        };

        const intervalId = window.setInterval(refreshQuietly, AVAILABILITY_REFRESH_MS);
        document.addEventListener("visibilitychange", refreshQuietly);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", refreshQuietly);
        };
    }, [loadAvailability]);

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
        if (!token && !reservationId) {
            return;
        }

        const loadReservation = async () => {
            try {
                const response = await fetch(
                 reservationId
                        ? `${API_URL}/reservations/${reservationId}`
                        : `${API_URL}/reservations/manage/${token}`,
                    { credentials: "include" }
                );

                if (response.status === 401 || response.status === 403) {
                    throw new Error("You are not authorized to edit this reservation.");
                }
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
    }, [token, reservationId]);

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
            : Math.min(MAX_PARTY_SIZE, Math.max(MIN_PARTY_SIZE, value));

        setGuestCount(safeValue);
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

        const errors = validateReservationForm(form);


    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
        return;
    }

        setIsSubmitting(true);

    const reservationData = createReservationData(
        form,
        selectedDay,
        selectedTime,
        guestCount
    );

        try {
            const url = isStaffEdit
            ? `${API_URL}/reservations/${reservationId}`
            : token
                ? `${API_URL}/reservations/manage/${token}`
                : `${API_URL}/reservations`;

            const response = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(isStaffEdit ? await getCsrfHeaders() : {}),
                },
                body: JSON.stringify(reservationData),
            });

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
        isStaffEdit,
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
        handleInputChange,
        handleSubmit,
        isCancelling,
        isCancelled,
        handleCancel,
    };
}

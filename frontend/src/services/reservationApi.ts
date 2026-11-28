
import type { ReservationAvailability } from "../types/reservation";
import { getCsrfHeaders } from "../hooks/csrf";
import type { createReservationData } from "../utils/reservationData";

// Base URL for reservation-related API requests.
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

/**
 * Parses a JSON response safely.
 * Returns null if the response body is empty or contains invalid JSON.
 */
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

/**
 * Fetches reservation availability for the given date range.
 *
 * @param from - Start date of the requested period.
 * @param to - End date of the requested period.
 * @returns Available reservation slots and their remaining capacity.
 * @throws Error if the request fails or the response is invalid.
 */
export async function fetchReservationAvailability(
    from: string,
    to: string
): Promise<ReservationAvailability[]> {
    const query = new URLSearchParams({ from, to });

    const response = await fetch(
        `${API_URL}/reservations/availability?${query.toString()}`
    );

    if (!response.ok) {
        throw new Error(
            `Unable to load availability (${response.status}).`
        );
    }

    const reservations = await readJson(response);

    // Validate the API response before returning it to the caller.
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

    return reservations;
}


/**
 * Fetches an existing reservation for editing.
 * Staff members use a reservation ID, while customers use an edit token.
 *
 * @param token - Customer's reservation edit token.
 * @param reservationId - Reservation ID used by staff members.
 * @returns The requested reservation.
 * @throws Error if access is denied or the reservation is not found.
 */
export async function fetchReservation(
    token?: string,
    reservationId?: string
) {
    const response = await fetch(
        reservationId
            ? `${API_URL}/reservations/${reservationId}`
            : `${API_URL}/reservations/manage/${token}`,
        { credentials: "include" }
    );

    // Handle authorization errors separately from other request failures.
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

    return reservation;
}


/**
 * Creates a new reservation or updates an existing reservation.
 *
 * Staff members use a reservation ID, while customers use an edit token.
 * If neither is provided, a new reservation is created.
 *
 * @param reservationData - Reservation data sent to the backend.
 * @param token - Optional customer edit token.
 * @param reservationId - Optional reservation ID for staff edits.
 * @returns The saved reservation.
 * @throws Error if saving fails or the response is empty.
 */
export async function saveReservation(
    reservationData: ReturnType<typeof createReservationData>,
    token?: string,
    reservationId?: string
) {
    const isStaffEdit = Boolean(reservationId);
    const isEditMode = Boolean(token) || isStaffEdit;

    // Select the endpoint based on the reservation operation.
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
            // Include CSRF headers when editing as a staff member.
            ...(isStaffEdit ? await getCsrfHeaders() : {}),
        },
        body: JSON.stringify(reservationData),
    });

    // Preserve the original error message returned by the backend.
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

    return savedReservation;
}


/**
 * Creates a receipt for a newly created reservation.
 *
 * @param reservationId - ID of the saved reservation.
 * @param editToken - Token used to authorize receipt creation.
 * @throws Error if receipt creation fails.
 */
export async function createReservationReceipt(
    reservationId: number,
    editToken: string
): Promise<void> {
    const response = await fetch(
        `${API_URL}/receipts/${reservationId}`,
        {
            method: "POST",
            headers: {
                "X-Reservation-Token": editToken,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Receipt creation failed");
    }
}


/**
 * Cancels an existing reservation using the customer's edit token.
 *
 * @param token - Edit token identifying and authorizing the reservation.
 * @throws Error if the cancellation request fails.
 */
export async function cancelReservation(token: string): Promise<void> {
    const response = await fetch(
        `${API_URL}/reservations/manage/${token}/cancel`,
        {
            method: "PATCH",
            credentials: "include",
        }
    );

    // Preserve the error message returned by the backend.
    if (!response.ok) {
        const errorData = await readJson(response);
        throw new Error(
            errorData?.message ||
            `Cancellation failed: ${response.status}`
        );
    }
}

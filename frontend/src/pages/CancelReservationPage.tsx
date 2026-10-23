import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCsrfHeaders } from "../hooks/csrf.ts";

type Customer = {
    firstname: string;
    lastname: string;
    email: string;
};

type Reservation = {
    reservationId: number;
    customer: Customer;
    startTime: string;
    endTime: string;
    datetime: string;
    partySize: number;
    status: { name: string } | null;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const CancelReservationPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReservation = async () => {
            try {
                const response = await fetch(`${API_URL}/reservations/${id}`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Reservation not found.");
                }

                setReservation((await response.json()) as Reservation);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load reservation."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadReservation();
    }, [id, navigate]);

    const handleYes = async () => {
        setIsCancelling(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/reservations/${id}/cancel`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: await getCsrfHeaders(),
                }
            );

            if (response.status === 401) {
                navigate("/login");
                return;
            }

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.message ?? "Unable to cancel reservation.");
            }

            navigate("/owner/dashboard");
        } catch (cancelError) {
            setError(
                cancelError instanceof Error
                    ? cancelError.message
                    : "Unable to cancel reservation."
            );
            setIsCancelling(false);
        }
    };

    const handleNo = () => {
        navigate("/owner/dashboard");
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-dark-bg px-4 text-white">
            <section className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-6 text-center">
                <h1 className="font-headline text-2xl font-semibold">
                    Cancel reservation
                </h1>

                {isLoading && (
                    <p className="mt-4 text-sm text-zinc-400">
                        Loading reservation...
                    </p>
                )}

                {reservation && (
                    <div className="mt-4 text-sm text-zinc-400">
                        <p className="font-medium text-wine-light">
                            #{reservation.reservationId}
                        </p>

                        <p>
                            {reservation.customer.firstname}{" "}
                            {reservation.customer.lastname}
                        </p>

                        <p>
                            {reservation.datetime.split(" ")[0]},{" "}
                            {reservation.startTime} – {reservation.endTime}
                        </p>

                        <p>
                            {reservation.partySize} guests
                        </p>
                    </div>
                )}

                {error && (
                    <p className="mt-4 text-sm text-red-400">
                        {error}
                    </p>
                )}

                {reservation?.status?.name === "CANCELLED" ? (
                    <>
                        <p className="mt-6">
                            This reservation is already cancelled.
                        </p>

                        <button
                            type="button"
                            onClick={handleNo}
                            className="mt-6 rounded border border-card-border px-4 py-2 text-sm text-zinc-300"
                        >
                            Back to dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <p className="mt-6">
                            Are you sure you want to cancel this reservation?
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleYes}
                                disabled={isCancelling || !reservation}
                                className="rounded border border-card-border px-6 py-2 text-sm text-red-400 disabled:opacity-50"
                            >
                                {isCancelling ? "Cancelling..." : "Yes"}
                            </button>

                            <button
                                type="button"
                                onClick={handleNo}
                                disabled={isCancelling}
                                className="rounded border border-card-border px-6 py-2 text-sm text-zinc-300 disabled:opacity-50"
                            >
                                No
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
};

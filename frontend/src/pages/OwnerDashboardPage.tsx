import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    details: string;
    status: {name: string} | null;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const OwnerDashboardPage = () => {
    const navigate = useNavigate();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReservations = async () => {
            try {
                const response = await fetch(`${API_URL}/reservations`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to load reservations.");
                }

                const data = (await response.json()) as Reservation[];
                setReservations(data);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load reservations."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadReservations();
    }, [navigate]);

    const handleLogout = async () => {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });

        navigate("/login");
    };

    return (
        <main className="min-h-screen bg-dark-bg px-4 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex items-center justify-between border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">
                            Reservations
                        </h1>

                        <p className="mt-1 text-sm text-zinc-400">
                            Manage restaurant reservations
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded border border-card-border px-3 py-1.5 text-sm text-zinc-300"
                    >
                        Log out
                    </button>
                </header>

                {isLoading && (
                    <p className="text-sm text-zinc-400">
                        Loading reservations...
                    </p>
                )}

                {error && (
                    <p className="text-sm text-red-400">
                        {error}
                    </p>
                )}

                {!isLoading && !error && (
                    <section className="overflow-hidden rounded-xl border border-card-border bg-card-bg">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="border-b border-card-border bg-surface-input text-xs uppercase tracking-wider text-zinc-400">
                                    <tr>
                                        <th className="px-4 py-3">
                                            ID & Time
                                        </th>

                                        <th className="px-4 py-3">
                                            Guest
                                        </th>

                                        <th className="px-4 py-3">
                                            Email
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Party
                                        </th>

                                        <th className="px-4 py-3">
                                            Special requests
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-card-border">
                                    {reservations.map((reservation) => (
                                        <tr key={reservation.reservationId}
                                        className={reservation.status?.name === "CANCELLED" ? "opacity-50" : ""}>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-wine-light">
                                                    #{reservation.reservationId}
                                                </p>

                                                <p className="text-xs text-zinc-400">
                                                    {reservation.startTime} –{" "}
                                                    {reservation.endTime}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 font-medium">
                                                {reservation.customer.firstname}{" "}
                                                {reservation.customer.lastname}
                                            </td>

                                            <td className="px-4 py-4 text-sm text-zinc-400">
                                                {reservation.customer.email}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                {reservation.partySize}
                                            </td>

                                            <td className="max-w-xs px-4 py-4 text-sm text-zinc-400">
                                                {reservation.details || "—"}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded border border-card-border px-3 py-1.5 text-xs text-zinc-300"
                                                    >
                                                        Edit
                                                    </button>

                                                    {reservation.status?.name === "CANCELLED" ? (
                                                        <span className="px-3 py-1.5 text-xs text-zinc-500">
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/owner/reservations/${reservation.reservationId}/cancel`)}
                                                        className="rounded border border-card-border px-3 py-1.5 text-xs text-red-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {reservations.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-400">
                                No reservations found.
                            </p>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
};
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, SearchIcon } from "../components/icons";
import {
    OwnerShell,
    ROLE_ADMIN,
    ROLE_EMPLOYEE,
    ROLE_OWNER,
    focusRing,
    iconBtn,
    primaryBtn,
} from "../components/OwnerShell";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

type User = {
    id: number;
    username: string;
    email: string;
    roleId: number;
};

const ROLE_NAMES: Record<number, string> = {
    [ROLE_ADMIN]: "Admin",
    [ROLE_OWNER]: "Owner",
    [ROLE_EMPLOYEE]: "Employee",
};

const roleName = (roleId: number) => ROLE_NAMES[roleId] ?? "Unknown";

/** Admins first, then owners, then employees; alphabetical within each role. */
const byRoleThenName = (a: User, b: User) => a.roleId - b.roleId || a.username.localeCompare(b.username);

type RoleFilter = "all" | number;

const chip = "inline-flex items-center rounded border px-2 py-0.5 text-sm font-semibold";
const headCell = "px-5 py-3.5 text-left text-sm font-semibold text-zinc-300";

export default function UserManagement() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const authResponse = await fetch(`${API_URL}/users/me`, {
                    credentials: "include",
                });

                if (authResponse.status === 401 || authResponse.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!authResponse.ok) {
                    throw new Error("Could not verify user.");
                }

                const me = await authResponse.json();
                const myRole = Number(me.roleId);

                // Employees are signed in but may not manage users.
                if (myRole !== ROLE_ADMIN && myRole !== ROLE_OWNER) {
                    navigate("/dashboard");
                    return;
                }

                setCurrentUserId(Number(me.id));

                const response = await fetch(`${API_URL}/users`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Could not fetch users.");
                }

                const data: User[] = (await response.json()).map((user: User) => ({
                    ...user,
                    roleId: Number(user.roleId),
                }));

                // Owners don't see admin accounts.
                const visible = myRole === ROLE_OWNER ? data.filter((user) => user.roleId !== ROLE_ADMIN) : data;

                setUsers(visible.sort(byRoleThenName));
            } catch (error) {
                console.error("Failed to fetch users:", error);
                setLoadError("Could not load users.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [navigate]);

    /** Only roles that actually appear get a filter pill. */
    const roleCounts = useMemo(() => {
        const counts = new Map<number, number>();
        for (const user of users) counts.set(user.roleId, (counts.get(user.roleId) ?? 0) + 1);
        return [...counts].sort(([a], [b]) => a - b);
    }, [users]);

    const shownUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return users.filter(
            (user) =>
                (roleFilter === "all" || user.roleId === roleFilter) &&
                (!query || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
        );
    }, [users, roleFilter, search]);

    const openAddUser = () => navigate("/owner/adduser");
    const accountCount = `${users.length} staff ${users.length === 1 ? "account" : "accounts"}`;
    const ready = !loading && !loadError;

    const filterPill = (value: RoleFilter, label: string, count: number) => {
        const on = roleFilter === value;
        return (
            <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => setRoleFilter(value)}
                className={`min-h-11 flex-none whitespace-nowrap rounded-full px-4 text-base font-medium transition-colors ${focusRing} ${
                    on ? "bg-card-bg text-white shadow-[inset_0_0_0_1px_#3F3F46]" : "text-zinc-300 hover:text-white"
                }`}
            >
                {label} · <span className="tabular-nums">{count}</span>
            </button>
        );
    };

    return (
        <OwnerShell
            active="users"
            mobileHeader={
                <>
                    <h1 className="text-[26px] font-semibold leading-8 text-white">Users</h1>
                    <button type="button" onClick={openAddUser} aria-label="Add user" className={iconBtn}>
                        <PlusIcon />
                    </button>
                </>
            }
        >
            <header className="hidden items-end justify-between gap-4 md:flex">
                <div>
                    <div className="text-sm font-semibold text-zinc-300">{ready ? accountCount : "Staff"}</div>
                    <h1 className="text-4xl font-medium leading-11 text-white">Users</h1>
                </div>
                <button type="button" onClick={openAddUser} className={primaryBtn}>
                    <PlusIcon />
                    Add user
                </button>
            </header>

            {loading && <p className="text-sm text-zinc-400">Loading users...</p>}

            {!loading && loadError && (
                <p role="alert" className="text-sm text-red-400">
                    {loadError}
                </p>
            )}

            {ready && (
                <>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Scrolls sideways on narrow phones instead of wrapping. */}
                        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
                            <div
                                role="group"
                                aria-label="Filter by role"
                                className="inline-flex gap-1 rounded-full border border-card-border bg-dark-bg p-1"
                            >
                                {filterPill("all", "All", users.length)}
                                {roleCounts.map(([roleId, count]) => filterPill(roleId, roleName(roleId), count))}
                            </div>
                        </div>

                        <label className="flex h-12 w-full items-center gap-2.5 rounded border border-zinc-700 bg-dark-bg px-3.5 text-zinc-300 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-white lg:w-90">
                            <SearchIcon />
                            <span className="sr-only">Search username or email</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search username or email"
                                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-400"
                            />
                        </label>
                    </div>

                    <section className="overflow-hidden rounded-lg border border-card-border bg-card-bg">
                        <table className="w-full table-fixed border-collapse text-base">
                            <caption className="sr-only">Staff accounts</caption>
                            <thead className="bg-dark-bg">
                                <tr className="border-b border-card-border">
                                    <th scope="col" className={headCell}>User</th>
                                    {/* On phones the email sits under the name instead of in its own column. */}
                                    <th scope="col" className={`${headCell} hidden md:table-cell`}>Email</th>
                                    <th scope="col" className={`${headCell} w-32 text-right md:w-36 md:text-left`}>Role</th>
                                </tr>
                            </thead>

                            <tbody>
                                {shownUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-card-border last:border-0">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    aria-hidden="true"
                                                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-zinc-800 text-[15px] font-semibold uppercase text-white"
                                                >
                                                    {user.username.charAt(0)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className="truncate font-semibold text-white">{user.username}</span>
                                                        {user.id === currentUserId && (
                                                            <span className={`${chip} border-zinc-700 text-zinc-300`}>You</span>
                                                        )}
                                                    </div>
                                                    <div title={user.email} className="mt-0.5 truncate text-sm text-zinc-400 md:hidden">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td title={user.email} className="hidden truncate px-5 py-4 text-zinc-300 md:table-cell">{user.email}</td>
                                        <td className="px-5 py-4 text-right md:text-left">
                                            <span
                                                className={`${chip} ${
                                                    user.roleId === ROLE_ADMIN
                                                        ? "border-wine/60 text-[#ffb2bf]"
                                                        : "border-zinc-700 text-zinc-300"
                                                }`}
                                            >
                                                {roleName(user.roleId)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {shownUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-10 text-center text-zinc-400">
                                            {users.length === 0 ? "No users found." : "No users match your search."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </OwnerShell>
    );
}

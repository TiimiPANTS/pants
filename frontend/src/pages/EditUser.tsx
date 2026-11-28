import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "../components/ChangePasswordForm";
import PersonalForm from "../components/PersonalForm";
import { OwnerShell } from "../components/OwnerShell";
import { fetchCurrentAccount, type Account } from "../services/accountApi";

export default function EditUser() {
    const navigate = useNavigate();
    const [account, setAccount] = useState<Account | null>(null);

    useEffect(() => {
        fetchCurrentAccount().then((current) => {
            if (current) setAccount(current);
            else navigate("/login");
        });
    }, [navigate]);

    return (
        <OwnerShell
            active="account"
            mobileHeader={<h1 className="text-[26px] font-semibold leading-8 text-white">My account</h1>}
        >
            <header>
                <h1 className="hidden text-4xl font-medium leading-11 text-white md:block">My account</h1>
                <p className="text-sm text-zinc-400 md:mt-1">Manage your personal information and account settings</p>
            </header>

            {account ? (
                <div className="grid max-w-5xl grid-cols-1 items-start gap-5 md:gap-6 lg:grid-cols-2">
                    <PersonalForm account={account} />
                    <ChangePasswordForm />
                </div>
            ) : (
                <p className="text-sm text-zinc-400">Loading account…</p>
            )}
        </OwnerShell>
    );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FAQS } from "../data/catalog";
import { api } from "../lib/api";
import type { SubscriptionPlan } from "../types";

export const PricingPage: React.FC = () => {
  const { user, refreshUser, updateLocalCredits, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [annual, setAnnual] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get<{ plans: SubscriptionPlan[] }>("/api/public/plans")
      .then((res) => setPlans(res.plans))
      .catch(() => {});
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!requireAuth("/pricing", `subscribe to the ${planId} membership plan`)) {
      return;
    }
    const res = await api.post<{ credits: number; message: string }>(
      `/api/dashboard/subscription/switch/${planId}`
    );
    updateLocalCredits(res.credits);
    setMessage(res.message);
    await refreshUser();
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
            Membership & Credits
          </span>
          <h1 className="mt-2 font-editorial text-4xl font-semibold text-[#172B3A] sm:text-5xl">
            Plans crafted for homeowners, stagers & architecture firms
          </h1>
          <div className="mt-6 inline-flex items-center rounded-full border border-[#DCCBB5] bg-white p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-xs font-medium ${
                !annual ? "bg-[#172B3A] text-white" : "text-[#252B2E]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-xs font-medium ${
                annual ? "bg-[#172B3A] text-white" : "text-[#252B2E]"
              }`}
            >
              Annual Billing
            </button>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-3xl flex items-start gap-2.5 rounded-2xl border border-[#DCCBB5] bg-white px-4 py-3 text-xs text-[#252B2E]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C87960]" />
          <span>
            Plan prices and monthly AI credit allowances are live-configurable from the Admin Console. Payment gateway checkout is intentionally omitted in this release.
          </span>
        </div>

        {message && (
          <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-[#9BAE9A] bg-[#9BAE9A]/25 px-4 py-3 text-xs font-medium text-[#172B3A]">
            {message}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((pl) => {
            const price = annual ? pl.annual_price : pl.monthly_price;
            const isPro = pl.id === "professional";
            return (
              <div
                key={pl.id}
                className={`rounded-3xl p-8 ${
                  isPro
                    ? "bg-[#172B3A] text-[#F7F4ED] shadow-editorial ring-2 ring-[#C87960]"
                    : "editorial-card text-[#252B2E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl font-semibold">{pl.name}</h2>
                  {user?.plan_id === pl.id && (
                    <span className="rounded-full bg-[#9BAE9A] px-3 py-1 text-[10px] font-semibold text-[#172B3A]">
                      Current Plan
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-editorial text-4xl font-semibold">${price}</span>
                  <span className="text-xs opacity-70">/ month</span>
                </div>
                <div className="mt-1 text-xs font-medium text-[#C87960]">
                  {pl.credits_per_month} AI credits included monthly
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {pl.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9BAE9A]" />
                      <span className="opacity-85">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(pl.id)}
                  className={`mt-8 w-full justify-center ${
                    isPro ? "btn-terracotta" : "btn-primary"
                  }`}
                >
                  {user ? `Activate ${pl.name}` : `Start with ${pl.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl mx-auto space-y-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#172B3A] text-center">
            Billing & Credit FAQs
          </h2>
          {FAQS.slice(0, 3).map((f) => (
            <div key={f.q} className="editorial-card p-5">
              <div className="font-semibold text-sm text-[#172B3A]">{f.q}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#252B2E]/75">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


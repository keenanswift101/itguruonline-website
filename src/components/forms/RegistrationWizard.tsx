"use client";

import { useEffect, useReducer, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepApplicantInfo } from "./steps/StepApplicantInfo";
import { StepDomainDetails } from "./steps/StepDomainDetails";
import { StepServiceSelection } from "./steps/StepServiceSelection";
import { StepDeclaration } from "./steps/StepDeclaration";
import type {
  RegistrationFormData,
  StepAData,
  StepBData,
  StepCData,
  StepDData,
} from "@/lib/registration-types";
import {
  defaultStepA,
  defaultStepB,
  defaultStepC,
  defaultStepD,
} from "@/lib/registration-types";
import type { HostingPackageDTO } from "@/lib/pricing";

// ── State ──────────────────────────────────────────────────────────────────
interface WizardState {
  step: 0 | 1 | 2 | 3;
  data: RegistrationFormData;
  submitState: "idle" | "loading" | "success" | "error";
  submitError: string | null;
  referenceId: string | null;
}

type WizardAction =
  | { type: "NEXT_A"; payload: StepAData }
  | { type: "NEXT_B"; payload: StepBData }
  | { type: "NEXT_C"; payload: StepCData }
  | { type: "BACK" }
  | { type: "SUBMITTING" }
  | { type: "SUCCESS"; referenceId: string }
  | { type: "ERROR"; message: string };

const DRAFT_KEY = "itguru_registration_draft";

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_A":
      return { ...state, step: 1, data: { ...state.data, stepA: action.payload } };
    case "NEXT_B":
      return { ...state, step: 2, data: { ...state.data, stepB: action.payload } };
    case "NEXT_C":
      return { ...state, step: 3, data: { ...state.data, stepC: action.payload } };
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1) as WizardState["step"] };
    case "SUBMITTING":
      return { ...state, submitState: "loading", submitError: null };
    case "SUCCESS":
      return { ...state, submitState: "success", referenceId: action.referenceId };
    case "ERROR":
      return { ...state, submitState: "error", submitError: action.message };
    default:
      return state;
  }
}

// ── Step indicator ─────────────────────────────────────────────────────────
const STEPS = ["Applicant", "Domain", "Services", "Declaration"];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Form progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className="flex items-center w-full">
                  <div
                    className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      done
                        ? "bg-primary-700 border-primary-700 text-white"
                        : active
                        ? "bg-(--bg-primary) border-primary-700 text-primary-700"
                        : "bg-(--bg-primary) border-(--border-color) text-(--text-secondary)"
                    }`}
                  >
                    {done ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-primary-700" : "bg-(--border-color)"}`} />
                  )}
                </div>
                <span className={`mt-1 text-xs font-medium hidden sm:block ${active ? "text-primary-700" : "text-(--text-secondary)"}`}>
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Success state ──────────────────────────────────────────────────────────
function SuccessView({ referenceId, name }: { referenceId: string; name: string }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00aaff]/15 border border-[#00aaff]/50"
        style={{ boxShadow: "0 0 24px -2px rgba(0,170,255,0.55)" }}
      >
        <svg className="h-8 w-8 text-[#00aaff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
      <p className="text-slate-300">
        Thank you, <strong className="text-white">{name}</strong>. Your application has been received.
      </p>
      <div className="bg-metallic-navy inline-block rounded-xl border border-[#00aaff]/50 px-6 py-3 shadow-[0_0_20px_-4px_rgba(0,170,255,0.5)]">
        <p className="text-xs text-blue-200">Reference Number</p>
        <p className="text-xl font-mono font-bold text-white mt-0.5">{referenceId}</p>
      </div>
      <p className="text-sm text-slate-300 max-w-sm mx-auto">
        A confirmation email has been sent to you. IT-Guru Online will contact you within 1 business day.
      </p>
      <p className="text-sm text-slate-300">
        Questions? Call or WhatsApp{" "}
        <a href="tel:+27729627608" className="text-primary-400 font-medium">+27 72 962 7608</a>
        {" "}(Mon – Fri, 08:30 – 17:00)
      </p>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────
export function RegistrationWizard({ packages }: { packages: HostingPackageDTO[] }) {
  const searchParams = useSearchParams();
  const prefilledDomain = searchParams.get("domain") ?? "";
  const wizardRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(wizardReducer, {
    step: 0,
    data: {
      stepA: defaultStepA,
      stepB: { ...defaultStepB, domainName: prefilledDomain },
      stepC: defaultStepC,
      stepD: defaultStepD,
    },
    submitState: "idle",
    submitError: null,
    referenceId: null,
  });

  // Restore draft from localStorage (expires after 24 hours to limit PII storage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<RegistrationFormData> & { _savedAt?: number };
        const savedAt = parsed._savedAt ?? 0;
        const ageMs = Date.now() - savedAt;
        const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
        if (ageMs > EXPIRY_MS) {
          localStorage.removeItem(DRAFT_KEY);
          return;
        }
        // Only restore stepA draft (personal info) — not domain (may come from URL)
        if (parsed.stepA) {
          dispatch({ type: "NEXT_A", payload: parsed.stepA });
          dispatch({ type: "BACK" }); // stay on step 0 but hydrate data
        }
      }
    } catch { /* ignore corrupt drafts */ }
  }, []);

  // Persist draft on each step change (with timestamp for expiry)
  useEffect(() => {
    if (state.submitState !== "success") {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state.data, _savedAt: Date.now() }));
      } catch { /* quota exceeded — ignore */ }
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [state.data, state.submitState]);

  // Scroll the wizard back into view at the top whenever the step changes,
  // so users land on the new step's heading instead of wherever they scrolled to.
  useEffect(() => {
    wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step]);

  const handleSubmit = useCallback(async (stepDData: StepDData) => {
    dispatch({ type: "SUBMITTING" });
    const payload: RegistrationFormData = {
      ...state.data,
      stepD: stepDData,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: { referenceId?: string; error?: string } = await res.json();
      if (!res.ok) {
        dispatch({ type: "ERROR", message: json.error ?? "Submission failed. Please try again." });
        return;
      }
      dispatch({ type: "SUCCESS", referenceId: json.referenceId! });
    } catch {
      dispatch({ type: "ERROR", message: "Network error. Please check your connection and try again." });
    }
  }, [state.data]);

  if (state.submitState === "success" && state.referenceId) {
    return (
      <SuccessView
        referenceId={state.referenceId}
        name={`${state.data.stepA.firstName} ${state.data.stepA.surname}`.trim()}
      />
    );
  }

  const selectedPkg = packages.find((p) => p.slug === state.data.stepC.hostingPackage);

  return (
    <div ref={wizardRef}>
      <StepIndicator current={state.step} />

      {state.submitState === "error" && state.submitError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {state.submitError}
        </div>
      )}

      {state.step === 0 && (
        <StepApplicantInfo
          data={state.data.stepA}
          onNext={(d) => dispatch({ type: "NEXT_A", payload: d })}
        />
      )}
      {state.step === 1 && (
        <StepDomainDetails
          data={state.data.stepB}
          onNext={(d) => dispatch({ type: "NEXT_B", payload: d })}
          onBack={() => dispatch({ type: "BACK" })}
        />
      )}
      {state.step === 2 && (
        <StepServiceSelection
          data={state.data.stepC}
          packages={packages}
          onNext={(d) => dispatch({ type: "NEXT_C", payload: d })}
          onBack={() => dispatch({ type: "BACK" })}
        />
      )}
      {state.step === 3 && (
        <StepDeclaration
          data={state.data.stepD}
          onSubmit={handleSubmit}
          onBack={() => dispatch({ type: "BACK" })}
          isSubmitting={state.submitState === "loading"}
        />
      )}

      {/* Summary sidebar — visible on step 3 */}
      {state.step === 3 && (
        <div className="mt-6 rounded-2xl border border-[#00aaff]/40 bg-white/8 backdrop-blur-xl p-4 text-sm shadow-[0_0_20px_-6px_rgba(0,170,255,0.4)]">
          <p className="font-semibold text-white mb-3">Application Summary</p>
          <dl className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <dt>Name:</dt>
              <dd className="font-medium text-white">
                {state.data.stepA.firstName} {state.data.stepA.surname}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Email:</dt>
              <dd className="font-medium text-white">{state.data.stepA.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Domain:</dt>
              <dd className="font-mono font-medium text-primary-400">{state.data.stepB.domainName}</dd>
            </div>
            {selectedPkg && (
              <div className="flex justify-between">
                <dt>Package:</dt>
                <dd className="font-medium text-white">{selectedPkg.name} — R{selectedPkg.priceRands}/{selectedPkg.pricePeriod}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

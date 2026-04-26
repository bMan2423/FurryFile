"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Link from "next/link";
import { Check, Zap, Crown, Sparkles, Star, ArrowLeft, Building2, UserCheck, PawPrint, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.string(),
});

type FormData = z.infer<typeof schema>;
type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  icon: React.ElementType;
  monthlyPrice: number;
  yearlyPrice: number;
  textColor: string;
  ringColor: string;
  checkBg: string;
  badge?: string;
  features: string[];
}

// ── Plans per role ──────────────────────────────────────────────────────────

const PLANS_BY_ROLE: Record<string, Plan[]> = {
  pet_owner: [
    {
      id: "starter",
      name: "Starter",
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      textColor: "text-gray-600 dark:text-gray-300",
      ringColor: "ring-gray-300 dark:ring-gray-600",
      checkBg: "bg-gray-500",
      features: [
        "Up to 2 pets",
        "Basic health records",
        "Community access",
        "Missing pet alerts",
      ],
    },
    {
      id: "family",
      name: "Family",
      icon: Sparkles,
      monthlyPrice: 799,
      yearlyPrice: 7990,
      textColor: "text-orange-600 dark:text-orange-400",
      ringColor: "ring-orange-400",
      checkBg: "bg-orange-500",
      badge: "Popular",
      features: [
        "Up to 5 pets",
        "Full health records & reminders",
        "Priority vet bookings",
        "Pet sitter access",
        "Everything in Starter",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      icon: Crown,
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      textColor: "text-purple-600 dark:text-purple-400",
      ringColor: "ring-purple-500",
      checkBg: "bg-purple-500",
      features: [
        "Unlimited pets",
        "Everything in Family",
        "24/7 vet chat support",
        "Emergency care assistance",
        "Dedicated account manager",
      ],
    },
  ],

  veterinarian: [
    {
      id: "basic",
      name: "Basic",
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      textColor: "text-gray-600 dark:text-gray-300",
      ringColor: "ring-gray-300 dark:ring-gray-600",
      checkBg: "bg-gray-500",
      features: [
        "Up to 10 appointments/month",
        "Basic public profile",
        "Patient records (limited)",
        "Community visibility",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      icon: Stethoscope,
      monthlyPrice: 2499,
      yearlyPrice: 24990,
      textColor: "text-green-600 dark:text-green-400",
      ringColor: "ring-green-500",
      checkBg: "bg-green-500",
      badge: "Popular",
      features: [
        "Unlimited appointments",
        "Full client & patient management",
        "Appointment scheduling tools",
        "Practice analytics dashboard",
        "Everything in Basic",
      ],
    },
    {
      id: "clinic",
      name: "Clinic",
      icon: Crown,
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      textColor: "text-purple-600 dark:text-purple-400",
      ringColor: "ring-purple-500",
      checkBg: "bg-purple-500",
      features: [
        "Multi-vet / staff accounts",
        "Everything in Professional",
        "Advanced analytics & reports",
        "Priority search placement",
        "Dedicated support line",
      ],
    },
  ],

  pet_sitter: [
    {
      id: "starter",
      name: "Starter",
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      textColor: "text-gray-600 dark:text-gray-300",
      ringColor: "ring-gray-300 dark:ring-gray-600",
      checkBg: "bg-gray-500",
      features: [
        "Up to 5 bookings/month",
        "Basic public profile",
        "Service listing (1 service)",
        "Client messaging",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      icon: Star,
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      textColor: "text-blue-600 dark:text-blue-400",
      ringColor: "ring-blue-500",
      checkBg: "bg-blue-500",
      badge: "Popular",
      features: [
        "Unlimited bookings",
        "All service types listed",
        "Client reviews & ratings",
        "Earnings tracker",
        "Everything in Starter",
      ],
    },
    {
      id: "business",
      name: "Business",
      icon: Crown,
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      textColor: "text-purple-600 dark:text-purple-400",
      ringColor: "ring-purple-500",
      checkBg: "bg-purple-500",
      features: [
        "Priority search placement",
        "Everything in Pro",
        "Multi-staff management",
        "Insurance support docs",
        "Business analytics",
      ],
    },
  ],

  shelter: [
    {
      id: "basic",
      name: "Basic",
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      textColor: "text-gray-600 dark:text-gray-300",
      ringColor: "ring-gray-300 dark:ring-gray-600",
      checkBg: "bg-gray-500",
      features: [
        "Up to 20 pet listings",
        "Basic adoption management",
        "Community events (2/month)",
        "Missing pet alerts",
      ],
    },
    {
      id: "standard",
      name: "Standard",
      icon: Building2,
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      textColor: "text-orange-600 dark:text-orange-400",
      ringColor: "ring-orange-400",
      checkBg: "bg-orange-500",
      badge: "Popular",
      features: [
        "Unlimited pet listings",
        "Full adoption management",
        "Volunteer management tools",
        "Donation tracking",
        "Everything in Basic",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      icon: Crown,
      monthlyPrice: 5999,
      yearlyPrice: 59990,
      textColor: "text-purple-600 dark:text-purple-400",
      ringColor: "ring-purple-500",
      checkBg: "bg-purple-500",
      features: [
        "Featured shelter placement",
        "Everything in Standard",
        "Advanced reporting & exports",
        "Dedicated shelter manager",
        "API access",
      ],
    },
  ],
};

// Role display info for the plan step header
const ROLE_META: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
  pet_owner:    { label: "Pet Owner",    icon: PawPrint,    desc: "Choose a plan to manage your pets" },
  veterinarian: { label: "Veterinarian", icon: Stethoscope, desc: "Choose a plan for your practice" },
  pet_sitter:   { label: "Pet Sitter",   icon: UserCheck,   desc: "Choose a plan to grow your business" },
  shelter:      { label: "Shelter",      icon: Building2,   desc: "Choose a plan for your shelter" },
};

const ROLE_OPTIONS = [
  { value: "pet_owner",    label: "Pet Owner" },
  { value: "veterinarian", label: "Veterinarian" },
  { value: "pet_sitter",   label: "Pet Sitter" },
  { value: "shelter",      label: "Pet Shelter" },
];

// ── Plan Card ───────────────────────────────────────────────────────────────

function PlanCard({ plan, selected, billing, onSelect }: {
  plan: Plan; selected: boolean; billing: BillingCycle; onSelect: () => void;
}) {
  const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const isFree = plan.monthlyPrice === 0;
  const Icon = plan.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-2xl border-2 p-5 transition-all ring-2",
        selected
          ? `border-current ${plan.ringColor} bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg`
          : "border-gray-200 dark:border-gray-700 ring-transparent bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow">
          {plan.badge}
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-xl", selected ? "bg-current/10" : "bg-gray-100 dark:bg-gray-800")}>
          <Icon className={cn("w-5 h-5", plan.textColor)} />
        </div>
        {selected && (
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", plan.checkBg)}>
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      <p className={cn("font-bold text-base mb-0.5", plan.textColor)}>{plan.name}</p>

      <p className="text-2xl font-extrabold dark:text-gray-100 mb-3">
        {isFree ? (
          "Free"
        ) : (
          <>
            <span className="text-base font-normal text-gray-400 mr-0.5">Rs.</span>
            {price.toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-1">
              /{billing === "monthly" ? "mo" : "yr"}
            </span>
          </>
        )}
      </p>

      <ul className="space-y-1.5">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

// ── Main Form ───────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "pet_owner" },
  });

  const watchedRole = watch("role");
  const isAdmin = watchedRole === "admin";

  function onStep1(data: FormData) {
    if (data.role === "admin") {
      // Admin accounts can't self-register with a plan
      return;
    }
    // Reset to first plan of this role group
    const plans = PLANS_BY_ROLE[data.role] ?? [];
    setSelectedPlan(plans[0]?.id ?? "starter");
    setFormData(data);
    setStep(2);
  }

  async function onSubmitWithPlan() {
    if (!formData) return;
    setSubmitting(true);
    try {
      await registerUser({ ...formData, subscription_plan: selectedPlan });
    } catch (err) {
      const msg = (err as any)?.response?.data?.detail ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2: Plan selection ──────────────────────────────────────────────
  if (step === 2 && formData) {
    const plans = PLANS_BY_ROLE[formData.role] ?? [];
    const meta = ROLE_META[formData.role];
    const selectedPlanObj = plans.find(p => p.id === selectedPlan);
    const isFreeSelected = (selectedPlanObj?.monthlyPrice ?? 0) === 0;
    const RoleIcon = meta?.icon ?? PawPrint;

    return (
      <div className="space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <RoleIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-gray-100">{meta?.label} Plans</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{meta?.desc ?? "Choose a plan to get started"}</p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 py-1">
          <span className={cn("text-sm", billing === "monthly" ? "font-semibold dark:text-gray-100" : "text-gray-400")}>
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
              billing === "yearly" ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
              billing === "yearly" ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
          <span className={cn("text-sm", billing === "yearly" ? "font-semibold dark:text-gray-100" : "text-gray-400")}>
            Yearly
            <span className="ml-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              Save ~17%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              billing={billing}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onSubmitWithPlan}
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting
            ? "Creating account…"
            : isFreeSelected
            ? "Get Started Free"
            : `Continue with ${selectedPlanObj?.name ?? "this plan"}`}
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          No credit card required for the free plan. Upgrade anytime from your dashboard.
        </p>
      </div>
    );
  }

  // ── Step 1: Account details ─────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
        <input {...register("full_name")} className="input-field" placeholder="Jane Smith" />
        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input {...register("email")} type="email" className="input-field" placeholder="you@example.com" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
        <input {...register("password")} type="password" className="input-field" placeholder="Min 8 characters" />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (optional)</label>
        <input {...register("phone")} type="tel" className="input-field" placeholder="+94 77 000 0000" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a</label>
        <select {...register("role")} className="input-field">
          {ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isSubmitting || isAdmin} className="btn-primary w-full">
        {isSubmitting ? "Please wait…" : "Next: Choose a Plan →"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

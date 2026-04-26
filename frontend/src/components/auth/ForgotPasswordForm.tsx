"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, getApiError } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      setSubmittedEmail(data.email);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (submittedEmail) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-700">
          If <strong>{submittedEmail}</strong> is registered, you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-sm text-gray-500">Check your spam folder if you don&apos;t see it.</p>
        <Link href="/login" className="text-primary-600 text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          {...register("email")}
          type="email"
          className="input-field"
          placeholder="you@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

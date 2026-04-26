"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { api, getApiError } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const schema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-500">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-primary-600 text-sm font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-gray-700">Your password has been reset successfully.</p>
        <button onClick={() => router.push("/login")} className="btn-primary w-full">
          Sign in
        </button>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    try {
      await api.post("/auth/reset-password", { token, new_password: data.new_password });
      setDone(true);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          {...register("new_password")}
          type="password"
          className="input-field"
          placeholder="Min 8 characters"
          autoComplete="new-password"
        />
        {errors.new_password && (
          <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <input
          {...register("confirm_password")}
          type="password"
          className="input-field"
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        {errors.confirm_password && (
          <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

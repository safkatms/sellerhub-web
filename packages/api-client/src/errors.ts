import { AxiosError } from "axios";
import { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import type { ProblemDetails } from "./types";

export const getProblem = (e: unknown): ProblemDetails | null =>
    e instanceof AxiosError && e.response?.data?.status ? (e.response.data as ProblemDetails) : null;

const camel = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function applyProblem<T extends FieldValues>(e: unknown, setError?: UseFormSetError<T>) {
    const p = getProblem(e);
    if (!p) return toast.error("Network error. Please try again.");
    if (p.code === "validation_failed" && p.errors) {
        // With a form, field errors go next to their inputs. Messages with no field (object-level rules have
        // an empty key) or no form at all (e.g. an action button) are listed in the toast instead.
        const unplaced: string[] = [];
        for (const [k, msgs] of Object.entries(p.errors)) {
            if (setError && k) setError(camel(k) as Path<T>, { message: msgs[0] });
            else unplaced.push(...msgs);
        }
        if (unplaced.length === 0) return;
        return toast.error(unplaced.length === 1 ? unplaced[0] : (p.title ?? "Please fix the following"), {
            description: unplaced.length > 1 ? unplaced.join("\n") : undefined,
        });
    }
    if (p.code === "plan_limit_reached") return toast.warning(p.title ?? "Plan limit reached. Upgrade to continue.");
    if (p.code === "concurrency_conflict") return toast.error("This record was changed by someone else. Reload and retry.");
    toast.error(p.title ?? "Something went wrong", { description: p.traceId ? `Trace: ${p.traceId}` : undefined });
}
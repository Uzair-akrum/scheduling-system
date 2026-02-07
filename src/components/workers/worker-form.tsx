"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { User, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { toStringArray } from "@/lib/string-array";
import {
  createShowcaseWorker,
  updateShowcaseWorker,
} from "@/lib/showcase-store";
import { isClientShowcaseMode } from "@/lib/showcase";

interface WorkerFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  skills: string;
  phone: string;
  isActive: boolean;
}

interface WorkerFormProps {
  worker?: User;
  isEditing?: boolean;
}

export function WorkerForm({ worker, isEditing = false }: WorkerFormProps) {
  const router = useRouter();

  const form = useForm<WorkerFormData>({
    defaultValues: {
      name: worker?.name || "",
      email: worker?.email || "",
      password: "",
      role: worker?.role || "WORKER",
      skills: toStringArray(worker?.skills).join(", "),
      phone: worker?.phone || "",
      isActive: worker?.isActive ?? true,
    },
  });

  const onSubmit = async (data: WorkerFormData) => {
    try {
      // Validation
      if (!data.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!data.email.trim() || !data.email.includes("@")) {
        toast.error("Valid email is required");
        return;
      }
      if (!isEditing && (!data.password || data.password.length < 6)) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      const payload = {
        ...data,
        skills: data.skills
          ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        ...(data.password ? { password: data.password } : {}),
      };

      const url = isEditing
        ? `/api/workers/${worker?.id}`
        : "/api/workers";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save worker");
      }

      if (isClientShowcaseMode()) {
        const workerData = {
          name: payload.name,
          email: payload.email,
          role: payload.role,
          skills: payload.skills,
          phone: payload.phone || null,
          isActive: payload.isActive,
        };

        if (isEditing && worker?.id) {
          updateShowcaseWorker(worker.id, workerData);
        } else {
          createShowcaseWorker(workerData);
        }
      }

      toast.success(isEditing ? "Worker updated" : "Worker created");
      router.push("/dashboard/workers");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? "New Password (leave blank to keep current)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="WORKER">Worker</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="555-0100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input
                  placeholder="cnc, machining, welding (comma-separated)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Active</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit">
            {isEditing ? "Update Worker" : "Create Worker"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/workers")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

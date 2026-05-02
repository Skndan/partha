// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import type { z } from "zod";

// import { Button } from "@workspace/ui/components/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@workspace/ui/components/form";
// import { Input } from "@workspace/ui/components/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@workspace/ui/components/select";
// import { Textarea } from "@workspace/ui/components/textarea";
// import { CreateProjectSchema } from "@/lib/validators/linear";

// type FormValues = z.infer<typeof CreateProjectSchema>;

// export function CreateProjectForm({
//   slug,
//   teams,
// }: {
//   slug: string;
//   teams: Array<{ id: string; name: string }>;
// }) {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(CreateProjectSchema as never),
//     defaultValues: {
//       name: "",
//       key: "",
//       description: "",
//       status: "planned",
//       teamId: null,
//       targetDate: null,
//     },
//   });

//   async function onSubmit(values: FormValues) {
//     setLoading(true);
//     const res = await fetch(`/api/workspaces/${slug}/projects`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ...values,
//         key: values.key.toUpperCase(),
//       }),
//     });

//     const data = await res.json().catch(() => null);
//     if (!res.ok) {
//       if (data?.error?.key?.[0]) {
//         form.setError("key", { message: data.error.key[0] });
//       } else {
//         toast.error("Unable to create project");
//       }
//       setLoading(false);
//       return;
//     }

//     toast.success("Project created");
//     form.reset();
//     router.refresh();
//     setLoading(false);
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-lg border p-4">
//         <h2 className="text-sm font-medium">Create project</h2>
//         <div className="grid gap-3 sm:grid-cols-2">
//           <FormField
//             control={form.control}
//             name="name"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Name</FormLabel>
//                 <FormControl>
//                   <Input placeholder="Website redesign" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="key"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Key</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="WEB"
//                     {...field}
//                     onChange={(event) => field.onChange(event.target.value.toUpperCase())}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="grid gap-3 sm:grid-cols-2">
//           <FormField
//             control={form.control}
//             name="teamId"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Team</FormLabel>
//                 <Select value={field.value ?? "none"} onValueChange={(value) => field.onChange(value === "none" ? null : value)}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Optional" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     <SelectItem value="none">No team</SelectItem>
//                     {teams.map((team) => (
//                       <SelectItem key={team.id} value={team.id}>
//                         {team.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="status"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Status</FormLabel>
//                 <Select value={field.value} onValueChange={field.onChange}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     <SelectItem value="planned">Planned</SelectItem>
//                     <SelectItem value="active">Active</SelectItem>
//                     <SelectItem value="completed">Completed</SelectItem>
//                     <SelectItem value="archived">Archived</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <FormField
//           control={form.control}
//           name="targetDate"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Target date</FormLabel>
//               <FormControl>
//                 <Input
//                   type="date"
//                   value={field.value ?? ""}
//                   onChange={(event) => field.onChange(event.target.value || null)}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="description"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Description (Markdown)</FormLabel>
//               <FormControl>
//                 <Textarea rows={4} placeholder="Project context..." {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <div className="flex justify-end">
//           <Button type="submit" disabled={loading}>
//             {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Project"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }

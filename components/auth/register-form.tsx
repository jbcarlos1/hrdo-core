"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { register } from "@/actions/register";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const RegisterForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            division: "MANAGEMENT",
            section: "ADMINISTRATIVE",
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            register(values).then((data) => {
                setError(data.error);
                setSuccess(data.success);
            });
        });
    };

    return (
        <CardWrapper
            headerLabel="Create an account"
            backButtonLabel="Already have an account?"
            backButtonHref="/auth/login"
            showSocial
            isPending={isPending}
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="Juan S. dela Cruz"
                                        />
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
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="jsdelacruz@up.edu.ph"
                                            type="email"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="division"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Division</FormLabel>
                                    <FormControl>
                                        <Select
                                            {...field}
                                            disabled={isPending}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select division" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MANAGEMENT">
                                                    Management
                                                </SelectItem>
                                                <SelectItem value="RECRUITMENT">
                                                    Recruitment Division
                                                </SelectItem>
                                                <SelectItem value="PLANNING_RESEARCH">
                                                    Planning & Research Division
                                                </SelectItem>
                                                <SelectItem value="DEVELOPMENT_BENEFITS">
                                                    Development & Benefits
                                                    Division
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="section"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section</FormLabel>
                                    <FormControl>
                                        <Select
                                            {...field}
                                            disabled={isPending}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EXECUTIVE">
                                                    Executive
                                                </SelectItem>
                                                <SelectItem value="ADMINISTRATIVE">
                                                    Administrative Section
                                                </SelectItem>

                                                <SelectItem value="RECRUITMENT_SELECTION">
                                                    Recruitment & Selection
                                                    Section
                                                </SelectItem>

                                                <SelectItem value="APPOINTMENT">
                                                    Appointment Section
                                                </SelectItem>

                                                <SelectItem value="PLANNING_RESEARCH">
                                                    Planning & Research Section
                                                </SelectItem>

                                                <SelectItem value="MONITORING_EVALUATION">
                                                    Monitoring & Evaluation
                                                    Section
                                                </SelectItem>

                                                <SelectItem value="INFORMATION_MANAGEMENT">
                                                    Information Management
                                                    Section
                                                </SelectItem>

                                                <SelectItem value="PROJECTS">
                                                    Projects Section
                                                </SelectItem>

                                                <SelectItem value="SCHOLARSHIP">
                                                    Scholarship Section
                                                </SelectItem>

                                                <SelectItem value="TRAINING">
                                                    Training Section
                                                </SelectItem>

                                                <SelectItem value="BENEFITS">
                                                    Benefits Section
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="password"
                                            type="password"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />

                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-full"
                    >
                        Create an account
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    );
};

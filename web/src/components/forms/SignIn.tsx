"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import ShimmerButton from "../ui/shimmer-button"
import { LabelInputContainer } from "@/components/labels/LabelContainer"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    email: z.string().email({
        message: "Invalid Email!"
    }),
    password: z.string().min(6, {
        message: "Password must be atleast 6 characters!"
    })
})

interface SignInFormProps {
    isLoading: boolean;
    handleSignIn: ({ email, password }: {
        email: string;
        password: string;
    }) => Promise<void>
}

export function SignInForm({ handleSignIn, isLoading }: SignInFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        handleSignIn({
            ...values
        })
    }

    return <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 w-full">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <LabelInputContainer>
                            <Label className="text-md font-thin">Username</Label>
                            <FormControl>
                                <Input placeholder="john.doe@gmail.com" {...field} />
                            </FormControl>
                            <FormMessage className="text-md" />
                        </LabelInputContainer>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <LabelInputContainer>
                            <Label className="text-md font-thin">Password</Label>
                            <FormControl>
                                <Input type="password" placeholder="secret-pattern" {...field} />
                            </FormControl>
                            <FormMessage className="text-md" />
                        </LabelInputContainer>
                    </FormItem>
                )}
            />
            <ShimmerButton
                type="submit"
                background="#059669"
                borderRadius='10px'
                shimmerSize="3px"
                className="w-full shadow-2xl font-bold disabled:opacity-[0.7] disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                Log in
            </ShimmerButton>
        </form>
    </Form>
}
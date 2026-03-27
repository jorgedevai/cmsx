"use client";

import React, { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { Check, ChevronRight, ChevronLeft, CalendarIcon, Code, Type, Hash, ToggleLeft, List, Image as ImageIcon, Sparkles, Loader2, FileText } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import useMeasure from "react-use-measure";
import api from "@/lib/api";

const FIELD_TYPES = [
    { label: "Text", value: "Text", icon: Type },
    { label: "Rich Text", value: "rich_text", icon: FileText },
    { label: "Number", value: "Number", icon: Hash },
    { label: "Boolean", value: "Boolean", icon: ToggleLeft },
    { label: "Date", value: "Date", icon: CalendarIcon },
    { label: "Json", value: "Json", icon: Code },
    { label: "Image", value: "Image", icon: ImageIcon },
];

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-_]+$/, "Slug must be lowercase, numbers, hyphens or underscores"),
    description: z.string().optional(),
    fields: z.array(z.object({
        name: z.string().min(1, "Field name is required"),
        field_type: z.string(),
        required: z.boolean().default(false),
    })).min(1, "At least one field is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function SchemaWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<number>();
    const [ref, bounds] = useMeasure();
    const router = useRouter();
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const form = useForm<FormValues>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            fields: [{ name: "title", field_type: "Text", required: true }],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "fields"
    });

    async function handleAiGenerate() {
        if (!aiPrompt) return;
        setAiLoading(true);

        try {
            const response = await api.post("/ai/generate", {
                prompt: `Generate a CMS content schema for: ${aiPrompt}\n\nReturn ONLY a JSON object with this exact structure, no other text:\n{"name": "Schema Name", "slug": "schema-name", "fields": [{"name": "Field Name", "field_type": "text", "required": true}]}\n\nValid field_type values: text, rich_text, number, boolean, date, image\nUse rich_text for long content fields (body, description, content).\nUse text for short fields (title, author, category).\nUse image for visual fields (cover, thumbnail, avatar).`,
                system_prompt: "You are a CMS schema architect. Output ONLY valid JSON. No markdown, no explanation, no code blocks, no HTML. Just the raw JSON object with the exact structure requested.",
            });

            const text = response.data.text || "";

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                toast.error("Could not parse AI response.");
                return;
            }

            const schema = JSON.parse(jsonMatch[0]);

            if (schema.name) form.setValue("name", schema.name);
            if (schema.slug) form.setValue("slug", schema.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));

            if (schema.fields && Array.isArray(schema.fields)) {
                const validTypes = ['text', 'rich_text', 'number', 'boolean', 'date', 'image', 'json'];
                const mappedFields = schema.fields.map((f: any) => {
                    let ft = (f.field_type || 'text').toLowerCase();
                    if (!validTypes.includes(ft)) ft = 'text';
                    // Capitalize for display (except rich_text)
                    const displayType = ft === 'rich_text' ? 'rich_text' : ft.charAt(0).toUpperCase() + ft.slice(1);
                    return {
                        name: f.name || "",
                        field_type: displayType,
                        required: !!f.required,
                    };
                });
                replace(mappedFields);
            }

            toast.success("Schema generated!");
            setAiPrompt("");
        } catch (error: any) {
            console.error(error);
            toast.error("AI generation failed.");
        } finally {
            setAiLoading(false);
        }
    }

    async function onSubmit(values: FormValues) {
        try {
            const formattedFields = values.fields.map(f => ({
                name: f.name,
                slug: f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''),
                field_type: f.field_type.toLowerCase(),
                required: f.required,
                options: [],
                validation: null
            }));

            await api.post("/schemas", {
                name: values.name,
                slug: values.slug,
                description: values.description,
                fields: formattedFields
            });

            toast.success("Schema created successfully!");
            router.push("/dashboard/schemas");
            router.refresh();
        } catch (error) {
            console.error("Schema creation error", error);
            toast.error("Failed to create schema. Please try again.");
        }
    }

    const nextStep = async () => {
        if (currentStep === 2) {
            // @ts-ignore
            await form.handleSubmit(onSubmit)();
            return;
        }

        let isValid = false;
        if (currentStep === 0) {
            isValid = await form.trigger(["name", "slug", "description"]);
        } else if (currentStep === 1) {
            isValid = await form.trigger("fields");
        } else {
            isValid = true;
        }

        if (isValid) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const stepTitles = [
        {
            title: "Basic Details",
            description: "Define the identity of your content type.",
        },
        {
            title: "Structure Fields",
            description: "Design the data structure for your content.",
        },
        {
            title: "Review & Create",
            description: "Verify your schema configuration.",
        },
    ];

    const watchedValues = form.watch();

    const content = useMemo(() => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 py-4">
                        {/* AI Schema Generator */}
                        <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">AI Schema Generator</p>
                                    <p className="text-xs text-muted-foreground">Describe what you need and AI will create the schema for you</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder='e.g. "Blog post with title, author, cover image and content"'
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAiGenerate();
                                        }
                                    }}
                                    disabled={aiLoading}
                                    className="bg-white dark:bg-background"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAiGenerate}
                                    disabled={aiLoading || !aiPrompt}
                                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {aiLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <FormField
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Schema Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Blog Post"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                const val = e.target.value;
                                                if (!form.getValues("slug") || form.getValues("slug") === val.toLowerCase().replace(/\s+/g, '-')) {
                                                    form.setValue("slug", val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''));
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Slug</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. blog-post"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Unique identifier used in API URLs.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What is this content type used for?"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-card relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                        <FormField
                                            name={`fields.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Field Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. title" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name={`fields.${index}.field_type`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {FIELD_TYPES.map(t => (
                                                                <SelectItem key={t.value} value={t.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <t.icon className="w-4 h-4" />
                                                                        {t.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <span className="sr-only">Delete</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-4 h-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => append({ name: "", field_type: "Text", required: false })}
                        >
                            <List className="w-4 h-4 mr-2" />
                            Add Field
                        </Button>
                        <FormMessage>{form.formState.errors.fields?.message || form.formState.errors.fields?.root?.message}</FormMessage>
                    </div>
                );
            case 2:
                // Review step remains mostly static, just displaying values
                return (
                    <div className="space-y-4 py-4">
                        <div className="rounded-xl border bg-card p-6">
                            <h3 className="text-lg font-semibold mb-1">{watchedValues.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{watchedValues.description || "No description provided."}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted py-1 px-2 rounded w-fit mb-6">
                                <Code className="w-3 h-3" />
                                {watchedValues.slug}
                            </div>

                            <h4 className="text-sm font-medium mb-3">Fields Configuration</h4>
                            <div className="space-y-2">
                                {watchedValues.fields?.map((f, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 px-3 border rounded text-sm">
                                        <span className="font-medium">{f.name}</span>
                                        <Badge variant="secondary">{f.field_type}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Ready to create your new content schema?
                        </p>
                    </div>
                );
            default:
                return null;
        }
    }, [currentStep, form, fields, watchedValues, remove, append, aiPrompt, aiLoading]);

    const variants = {
        initial: (direction: number) => {
            return { x: `${110 * direction}%`, opacity: 0 };
        },
        animate: { x: "0%", opacity: 1 },
        exit: (direction: number) => {
            return { x: `${-110 * direction}%`, opacity: 0 };
        },
    };

    return (
        <Form {...form}>
            <MotionConfig
                transition={{
                    duration: 0.5,
                    type: "spring",
                    bounce: 0,
                }}
            >
                <div className="flex w-full items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-lg border overflow-hidden bg-background">
                        <motion.div layout>
                            <CardHeader className="flex flex-col space-y-4 px-6 py-6 border-b">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle className="text-xl">
                                            {stepTitles[currentStep].title}
                                        </CardTitle>
                                        <CardDescription>
                                            {stepTitles[currentStep].description}
                                        </CardDescription>
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Step {currentStep + 1} of 3
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${((currentStep + 1) / 3) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </CardHeader>

                            <motion.div
                                animate={{ height: bounds.height > 0 ? bounds.height : "auto" }}
                                className="relative overflow-hidden bg-muted/5"
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            >
                                <div ref={ref}>
                                    <CardContent className="px-6 py-2 relative">
                                        <AnimatePresence
                                            mode="popLayout"
                                            initial={false}
                                            custom={direction}
                                        >
                                            <motion.div
                                                key={currentStep}
                                                variants={variants}
                                                initial="initial"
                                                animate="animate"
                                                exit="exit"
                                                className="w-full"
                                                custom={direction}
                                            >
                                                {content}
                                            </motion.div>
                                        </AnimatePresence>
                                    </CardContent>
                                </div>
                            </motion.div>

                            <CardFooter className="flex justify-between items-center border-t py-6 bg-background">
                                <Button
                                    variant={"outline"}
                                    type="button"
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button type="button" onClick={nextStep}>
                                    {currentStep === stepTitles.length - 1 ? (
                                        <>
                                            Create Schema <Check className="h-4 w-4 ml-2" />
                                        </>
                                    ) : (
                                        <>
                                            Continue <ChevronRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </motion.div>
                    </Card>
                </div>
            </MotionConfig>
        </Form>
    );
}

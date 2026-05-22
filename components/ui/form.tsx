"use client"

import * as React from "react"
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props}>{children}</form>
)

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>
  name: TName
  render: (props: { field: ReturnType<typeof useController<TFieldValues, TName>>["field"] }) => React.ReactNode
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ control, name, render }: FormFieldProps<TFieldValues, TName>) {
  const { field } = useController({ name, control })
  return (
    <FormFieldContext.Provider value={{ name }}>
      {render({ field })}
    </FormFieldContext.Provider>
  )
}

const FormItemContext = React.createContext<{ id: string }>({ id: "" })

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { id } = React.useContext(FormItemContext)
  return <Label ref={ref} htmlFor={id} className={cn(className)} {...props} />
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    const { id } = React.useContext(FormItemContext)
    return <div ref={ref} id={id} {...props} />
  }
)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-[0.8rem] text-muted-foreground", className)} {...props} />
  )
)
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <p ref={ref} className={cn("text-[0.8rem] font-medium text-destructive", className)} {...props}>
        {children}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }

import { cn } from "@/lib/utils"

interface SigmaSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function SigmaSpinner({ className, size = "md" }: SigmaSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-lg",
    md: "w-8 h-8 text-xl", 
    lg: "w-12 h-12 text-3xl",
    xl: "w-16 h-16 text-4xl"
  }

  return (
    <div className={cn("inline-flex items-center justify-center", sizeClasses[size], className)}>
      <div className="animate-spin text-blue-600 font-bold select-none">
        Σ
      </div>
    </div>
  )
}
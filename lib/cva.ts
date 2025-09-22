type ClassValue = string | number | boolean | undefined | null | ClassValue[]

interface VariantConfig {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export type VariantProps<T extends (...args: any) => any> = {
  [K in keyof Parameters<T>[0]]?: Parameters<T>[0][K] extends string ? Parameters<T>[0][K] : never
}

export function cva(base: string, config?: VariantConfig) {
  return (props: Record<string, any> = {}) => {
    let classes = base

    if (config?.variants) {
      for (const [key, variants] of Object.entries(config.variants)) {
        const value = props[key] || config.defaultVariants?.[key]
        if (value && variants[value]) {
          classes += " " + variants[value]
        }
      }
    }

    if (props.className) {
      classes += " " + props.className
    }

    return classes
  }
}

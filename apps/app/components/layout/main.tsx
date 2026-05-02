import { cn } from '@/lib/utils'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Main({ fixed, className, fluid, id = 'content', children, ...props }: MainProps) {
  return (
    <main
      id={id}
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'px-4 py-6',
        // When the layout is "fixed" we still need vertical scrolling so
        // content like data-table pagination can't get clipped.
        fixed && 'flex grow flex-col min-h-0 overflow-y-auto',
        className
      )}
      {...props}
    >
      {fluid ? (
        children
      ) : (
        <div className='@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl'>
          {children}
        </div>
      )}
    </main>
  )
}

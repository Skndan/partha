'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@workspace/ui/components/separator'
import { SidebarTrigger } from '@workspace/ui/components/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
    fixed?: boolean
    ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const readScrollTop = () => {
            const main = document.getElementById('content')
            if (main) {
                return main.scrollTop
            }
            return document.documentElement.scrollTop || document.body.scrollTop
        }

        const onScroll = () => {
            setOffset(readScrollTop())
        }

        onScroll()

        const main = document.getElementById('content')
        if (main) {
            main.addEventListener('scroll', onScroll, { passive: true })
            return () => main.removeEventListener('scroll', onScroll)
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={cn(
                'peer/header sticky top-0 z-50 h-16 w-full shrink-0 bg-background border-border border-b',
                fixed && 'header-fixed',
                offset > 10 && fixed ? 'shadow' : 'shadow-none',
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    'relative flex h-full items-center gap-3 p-4 sm:gap-4',
                    offset > 10 &&
                    fixed &&
                    'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
                )}
            >
                <SidebarTrigger className="max-md:scale-125" />
                <Separator orientation='vertical' className='h-6' />
                {children}
            </div>
        </header>
    )
}

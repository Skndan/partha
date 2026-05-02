import {
  Calendar,
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  MapPin,
  Building2,
  Landmark,
  UserSquare2,
  Vote,
} from 'lucide-react'
// import { ClerkLogo } from '@/assets/clerk-logo'
import { type SidebarData } from '@/components/layout/types'

export const adminSidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/admin/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Moderators',
          url: '/admin/moderators',
          icon: ListTodo,
        },
        // {
        //   title: 'State Master',
        //   url: '/admin/master/state',
        //   icon: Settings,
        // },
        // {
        //   title: 'Apps',
        //   url: '/apps',
        //   icon: Package,
        // },
        // {
        //   title: 'Chats',
        //   url: '/chats',
        //   badge: '3',
        //   icon: MessagesSquare,
        // },
        // {
        //   title: 'Users',
        //   url: '/users',
        //   icon: Users,
        // },
        // {
        //   title: 'Secured by Clerk',
        //   icon: ShieldCheck,
        //   items: [
        //     {
        //       title: 'Sign In',
        //       url: '/clerk/sign-in',
        //     },
        //     {
        //       title: 'Sign Up',
        //       url: '/clerk/sign-up',
        //     },
        //     {
        //       title: 'User Management',
        //       url: '/clerk/user-management',
        //     },
        //   ],
        // },
      ],
    },
    {
      title: 'Master',
      items: [
        {
          title: 'State',
          url: '/admin/master/state',
          icon: Settings,
        },
        {
          title: 'District',
          url: '/admin/master/district',
          icon: Building2,
        },
        {
          title: 'Assembly',
          url: '/admin/master/assembly',
          icon: MapPin,
        },
        {
          title: 'Elections',
          url: '/admin/master/election',
          icon: Vote,
        },
        {
          title: 'Parties',
          url: '/admin/master/party',
          icon: Landmark,
        },
        {
          title: 'Candidates',
          url: '/admin/master/candidate',
          icon: UserSquare2,
        },
      ],
    },
    // {
    //           title: 'Sign Up',
    //           url: '/sign-up',
    //         },
    //         {
    //           title: 'Forgot Password',
    //           url: '/forgot-password',
    //         },
    //         {
    //           title: 'OTP',
    //           url: '/otp',
    //         },
    //       ],
    //     },
    //     {
    //       title: 'Errors',
    //       icon: Bug,
    //       items: [
    //         {
    //           title: 'Unauthorized',
    //           url: '/errors/unauthorized',
    //           icon: Lock,
    //         },
    //         {
    //           title: 'Forbidden',
    //           url: '/errors/forbidden',
    //           icon: UserX,
    //         },
    //         {
    //           title: 'Not Found',
    //           url: '/errors/not-found',
    //           icon: FileX,
    //         },
    //         {
    //           title: 'Internal Server Error',
    //           url: '/errors/internal-server-error',
    //           icon: ServerOff,
    //         },
    //         {
    //           title: 'Maintenance Error',
    //           url: '/errors/maintenance-error',
    //           icon: Construction,
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   title: 'Other',
    //   items: [
    //     {
    //       title: 'Settings',
    //       icon: Settings,
    //       items: [
    //         {
    //           title: 'Profile',
    //           url: '/settings/profile',
    //           icon: UserCog,
    //         },
    //         {
    //           title: 'Organization',
    //           url: '/settings/organization',
    //           icon: Users,
    //         },
    //         {
    //           title: 'Availability',
    //           url: '/settings/availability',
    //           icon: Calendar,
    //         },
    //         {
    //           title: 'Blackouts',
    //           url: '/settings/blackouts',
    //           icon: Calendar,
    //         },
    //         // {
    //         //   title: 'Account',
    //         //   url: '/settings/account',
    //         //   icon: Wrench,
    //         // },
    //         // {
    //         //   title: 'Appearance',
    //         //   url: '/settings/appearance',
    //         //   icon: Palette,
    //         // },
    //         // {
    //         //   title: 'Notifications',
    //         //   url: '/settings/notifications',
    //         //   icon: Bell,
    //         // },
    //         // {
    //         //   title: 'Display',
    //         //   url: '/settings/display',
    //         //   icon: Monitor,
    //         // },
    //       ],
    //     },
    //     {
    //       title: 'Help Center',
    //       url: '/help-center',
    //       icon: HelpCircle,
    //     },
    //   ],
    // },
  ],
}

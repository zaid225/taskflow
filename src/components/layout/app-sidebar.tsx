import { ListChecks } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router'
import { navigation } from '@/app/navigation'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar'

export function AppSidebar({ onMobileClose }: { onMobileClose: () => void }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border" onMobileClose={onMobileClose}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-9 items-center gap-2.5 px-1">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <ListChecks className="size-4" aria-hidden="true" />
          </span>
          <span className="font-semibold group-data-[collapsible=icon]:sr-only">TaskFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <nav aria-label="Workspace">
            <SidebarMenu>
              {navigation.map(({ to, title, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    isActive={Boolean(matchPath(to, pathname))}
                    tooltip={title}
                    className="data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring"
                  >
                    <NavLink
                      to={to}
                      end
                      aria-label={title}
                      onClick={(event) => {
                        if (isMobile && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                          setOpenMobile(false)
                        }
                      }}
                    >
                      <Icon aria-hidden="true" />
                      <span>{title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

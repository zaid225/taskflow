# Engineering decisions

- Use Clerk's current custom-flow methods with TaskFlow-owned React forms. Clerk handles passwords, codes, and session activation while shadcn components preserve the application theme.
- Keep authentication and navigation independent. The router accepts return destinations only on TaskFlow's three protected workspace routes.
- Handle Device Trust and eligible second-factor email codes as explicit verification states. Pending sessions stay outside the workspace until Clerk completes their required tasks.
- Let ClerkJS and Clerk UI complete modern signup protection. The form stays pending during the challenge and enters the email verification screen only after Clerk has prepared a code.
- Serialize ownership-scoped writes with PostgreSQL transaction advisory locks. A failed Kanban move rolls back the whole reorder, and successful moves return the board snapshot written by that transaction.

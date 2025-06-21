import { useState, useEffect } from 'react'

export type Role = 'ADMIN' | 'SALESPERSON'

const VALID_ROLES: Role[] = ['ADMIN', 'SALESPERSON']

export function useUserRole(): Role | null {
    const [role, setRole] = useState<Role | null>(null)

    useEffect(() => {
        const storedRole =
            (localStorage.getItem('userRole') as Role) ?? 'SALESPERSON'
        if (storedRole && VALID_ROLES.includes(storedRole as Role)) {
            setRole(storedRole as Role)
        }
    }, [])

    return role
} 
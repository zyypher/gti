import api from '@/lib/api'
import routes from '@/lib/routes'
// import { showToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

export const logout = async () => {
    try {
        await api.post(routes.logout)
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        // showToast('Logout Successful', 'You have been logged out.', true)
    } catch (error) {
        // showToast('Error', 'Unable to log out. Please try again.', false)
    }
}

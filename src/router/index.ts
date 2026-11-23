import { createRouter, createWebHistory } from 'vue-router'

import Auth from '@/pages/Auth/index.vue'
import Feed from '@/pages/Feed/index.vue'
import History from '@/pages/History/index.vue'
import budget from '@/pages/Other/budget.vue'
import fridayCalories from '@/pages/Other/fridayCalories.vue'
import game from '@/pages/Other/game.vue'
import mileage from '@/pages/Other/mileage.vue'
import porridge from '@/pages/Other/porridge.vue'
import Profile from '@/pages/Profile/index.vue'
import Scales from '@/pages/Scales/index.vue'
import Settings from '@/pages/Settings/index.vue'
import { useUser } from '@/store/User'
import { isJwtValid } from '@/utils/jws'
const routes = [
  { path: '/', redirect: '/feed' },
  { path: '/feed', component: Feed },
  { path: '/settings', component: Settings },
  { path: '/history', component: History },
  {
    path: '/profile',
    component: Profile,
  },
  { path: '/Scales', component: Scales },
  {
    path: '/auth',
    component: Auth,
    meta: { blank: true },
  }, //blank: true отрисовывает компонент без хедера, меню и тд
  // Other
  {
    path: '/help-sobes',
    name: 'help-sobes',
    component: () => import('@/pages/Other/HelpSobes/index.vue'),
    meta: { blank: true },
  },
  { path: '/budget', component: budget, meta: { blank: true } },
  { path: '/game', component: game, meta: { blank: true } },
  { path: '/mileage', component: mileage, meta: { blank: true } },
  { path: '/porridge', component: porridge, meta: { blank: true } },
  { path: '/friday', component: fridayCalories, meta: { blank: true } },
]

const IS_DEMO =
  location.hostname.startsWith('demo.') || location.pathname.startsWith('/demo')
const router = createRouter({
  history: createWebHistory(IS_DEMO ? '/demo' : '/'),
  routes,
})

router.beforeEach((to) => {
  if (IS_DEMO || location.hostname.startsWith('demo')) {
    if (to.path === '/auth' || to.name === 'help-sobes') return '/feed'
    return true
  }
  const user = useUser()
  const authed = !!user.token && isJwtValid(user.token)
  if (to.path === '/auth') {
    if (authed) return to.query.next === '/help-sobes' ? '/help-sobes' : '/feed'
    return true
  }
  // все остальные роуты только для авторизованных
  if (!authed) {
    user.clear()
    if (to.name === 'help-sobes') {
      return { path: '/auth', query: { next: '/help-sobes' } }
    }
    return '/auth'
  }
  return true
})
export default router

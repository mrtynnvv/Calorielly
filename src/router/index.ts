import { createRouter, createWebHistory } from 'vue-router'

import Auth from '@/pages/Auth/index.vue'
import Feed from '@/pages/Feed/index.vue'
import game from '@/pages/Other/game.vue'
import timer from '@/pages/Other/timer.vue'
import Profile from '@/pages/Profile/index.vue'
import Scales from '@/pages/Scales/index.vue'
import Settings from '@/pages/Settings/index.vue'
import { useUser } from '@/store/User'
import { isJwtValid } from '@/utils/jws'
const routes = [
  { path: '/', redirect: '/feed' },
  { path: '/feed', component: Feed },
  { path: '/settings', component: Settings },
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
  { path: '/timer', component: timer, meta: { blank: true } },
  { path: '/game', component: game, meta: { blank: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const user = useUser()
  const authed = !!user.token && isJwtValid(user.token)
  //на /auth авторизованного юзера кидает в /feed
  if (to.path === '/auth') {
    if (authed) return '/feed'
    return true
  }
  // все остальные роуты только для авторизованных
  if (!authed) {
    user.clear()
    return '/auth'
  }
  return true
})
export default router

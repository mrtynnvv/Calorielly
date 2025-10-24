import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import { setupHttp } from '@/api/http'
import { useUser } from '@/store/User'

import './style.css'

import './styles/main.scss'

const app = createApp(App)

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
if (location.hostname.startsWith('demo')) {
  useUser().setToken('demo')
}
const IS_DEMO =
  location.hostname.startsWith('demo.') || location.pathname.startsWith('/demo')
if (IS_DEMO) {
  useUser().setToken('demo')
}
app.use(router)

setupHttp(router)

app.mount('#app')

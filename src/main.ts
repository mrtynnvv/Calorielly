import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import { setupHttp } from '@/api/http'

import './style.css'

import './styles/main.scss'

const app = createApp(App)

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)

app.use(router)

setupHttp(router)

app.mount('#app')

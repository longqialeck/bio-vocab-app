<template>
  <q-page class="flex flex-center column q-pa-md">
    <dna-logo large />
    <h1 class="text-h3 text-primary q-mt-lg q-mb-xs">BioVocab</h1>
    <p class="text-subtitle1 text-grey-7 q-ma-none">Master Biology Terms in English</p>
    
    <div class="loading-indicator q-mt-xl">
      <p class="text-grey-6">Loading...</p>
      <q-linear-progress indeterminate color="primary" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import DnaLogo from '../components/DnaLogo.vue'

export default defineComponent({
  name: 'SplashView',
  components: {
    DnaLogo
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    // Simulate loading and redirect
    setTimeout(() => {
      const isLoggedIn = userStore.loadUser()
      if (isLoggedIn) {
        router.push({ name: 'dashboard' })
      } else {
        router.push({ name: 'login' })
      }
    }, 2000)
    
    return {}
  }
})
</script>

<style scoped>
.loading-indicator {
  width: 120px;
  text-align: center;
}
</style> 
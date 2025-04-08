<template>
  <q-page class="flex flex-center column q-pa-md" style="max-width: 400px; margin: 0 auto;">
    <div class="row items-center q-mb-md full-width">
      <q-btn icon="arrow_back" flat round dense @click="goBack" />
      <h2 class="text-h5 q-mx-auto">Create Account</h2>
    </div>
    
    <q-form @submit="onSubmit" class="q-gutter-md full-width">
      <q-input
        filled
        v-model="fullName"
        label="Full Name"
        :rules="[val => !!val || 'Full name is required']"
      />
      
      <q-input
        filled
        v-model="email"
        type="email"
        label="Email"
        :rules="[
          val => !!val || 'Email is required',
          val => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val) || 'Please enter a valid email'
        ]"
      />
      
      <q-select
        filled
        v-model="gradeLevel"
        :options="gradeOptions"
        label="Grade Level"
        :rules="[val => !!val || 'Grade level is required']"
      />
      
      <q-input
        filled
        v-model="password"
        type="password"
        label="Password"
        :rules="[
          val => !!val || 'Password is required',
          val => val.length >= 6 || 'Password must be at least 6 characters'
        ]"
      />
      
      <q-input
        filled
        v-model="confirmPassword"
        type="password"
        label="Confirm Password"
        :rules="[
          val => !!val || 'Please confirm your password',
          val => val === password || 'Passwords do not match'
        ]"
      />
      
      <div class="q-mt-md">
        <q-checkbox v-model="agreeTerms" label="I agree to the">
          <q-btn flat dense color="primary" label="Terms of Service" />
          and
          <q-btn flat dense color="primary" label="Privacy Policy" />
        </q-checkbox>
      </div>
      
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mt-lg"
        label="Create Account"
        :loading="loading"
        :disable="!agreeTerms"
      />
    </q-form>
    
    <p class="q-mt-lg">Already have an account? <q-btn flat dense color="primary" label="Sign In" @click="goToLogin" /></p>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

export default defineComponent({
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    const fullName = ref('')
    const email = ref('')
    const gradeLevel = ref(null)
    const password = ref('')
    const confirmPassword = ref('')
    const agreeTerms = ref(false)
    const loading = ref(false)
    
    const gradeOptions = [
      '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
      '10th Grade', '11th Grade', '12th Grade', 'College'
    ]
    
    const onSubmit = async () => {
      loading.value = true
      
      // In a real app, this would register the user with a backend
      // For the prototype, we'll simulate registration
      setTimeout(() => {
        userStore.setUser({
          id: 'user_' + Math.floor(Math.random() * 1000000),
          name: fullName.value,
          email: email.value,
          gradeLevel: gradeLevel.value
        })
        
        loading.value = false
        router.push({ name: 'dashboard' })
      }, 1000)
    }
    
    const goToLogin = () => {
      router.push({ name: 'login' })
    }
    
    const goBack = () => {
      router.back()
    }
    
    return {
      fullName,
      email,
      gradeLevel,
      password,
      confirmPassword,
      agreeTerms,
      loading,
      gradeOptions,
      onSubmit,
      goToLogin,
      goBack
    }
  }
})
</script> 
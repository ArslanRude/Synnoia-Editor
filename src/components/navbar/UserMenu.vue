<template>
  <div class="relative flex items-center">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center w-8 h-8">
      <svg class="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Logged Out State -->
    <button
      v-else-if="!isAuthenticated" 
      @click="redirectToLogin"
      class="flex items-center justify-center"
      title="Sign In"
    >
      <icon name="user" size="20" color="currentcolor" />
    </button>

    <!-- Logged In State -->
    <div v-else class="relative">
      <button 
        @click.stop="toggleDropdown"
        class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 border border-gray-600 hover:border-cyan-400 transition-colors overflow-hidden"
        :title="displayName"
      >
        <div v-if="avatarUrl" class="w-full h-full">
          <img :src="avatarUrl" :alt="displayName" class="w-full h-full object-cover">
        </div>
        <div v-else class="w-full h-full flex items-center justify-center">
          <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </button>

      <!-- Dropdown Menu -->
      <div 
        v-if="isDropdownOpen"
        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ displayName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
        </div>
        <a 
          href="https://synnoia.vercel.app/app/dashboard.html"
          target="_blank"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Dashboard
        </a>
        <button 
          @click="handleLogout"
          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/auth'

const { user, profile, isLoading, isAuthenticated, displayName, avatarUrl, signOut, checkAuth } = useAuth()

const isDropdownOpen = ref(false)

const userEmail = computed(() => user.value?.email || '')

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleLogout = async () => {
  const { error } = await signOut()
  if (!error) {
    window.location.reload()
  }
}

const redirectToLogin = () => {
  // Save current URL for redirect after login
  sessionStorage.setItem('redirectAfterLogin', window.location.href)
  // Redirect to login page
  window.location.href = 'https://synnoia.vercel.app/auth/login.html'
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

onMounted(() => {
  checkAuth()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

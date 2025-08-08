<template>
  <nav>
    <div class="bg-secondary-light dark:bg-secondary-dark px-3 sm:px-5 py-2 flex items-center justify-between">
      <!-- Left: Logo and Brand -->
      <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        <div
          class="w-6 h-6 sm:w-8 sm:h-8 bg-highlight-light dark:bg-highlight-dark rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <span class="text-text-light dark:text-text-dark font-semibold text-sm sm:text-lg">MyWord</span>
      </div>

      <!-- Center: Editable Document Name -->
      <div class="flex-1 flex justify-center px-4">
        <input v-model="documentName"
          class="bg-transparent text-text-light dark:text-text-dark text-center font-medium text-sm sm:text-base border-none outline-none focus:bg-highlight-light dark:focus:bg-highlight-dark rounded px-2 py-1 min-w-0 max-w-xs dark:text-white"
          placeholder="Untitled Document" @blur="saveDocumentName" @keydown.enter="$event.target.blur()" />
      </div>

      <!-- Right: Theme Toggle -->
      <div class="flex items-center space-x-2 flex-shrink-0">
        <button
          class="p-2 hover:bg-highlight-light dark:hover:bg-highlight-dark rounded-lg transition-colors duration-200 text-black dark:text-gray-200"
          :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'" @click="toggleDark">
          <!-- Sun Icon for Light Mode -->
          <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.52,9.22 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.22 6.91,16.84 7.51,17.35L3.36,17M20.65,7L18.88,10.77C18.74,10 18.47,9.22 18.05,8.5C17.63,7.78 17.09,7.16 16.49,6.65L20.65,7M20.64,17L16.5,17.35C17.1,16.84 17.64,16.22 18.06,15.5C18.48,14.78 18.75,14 18.89,13.21L20.64,17M12,22L9.61,18.58C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.58L12,22Z" />
          </svg>
          <!-- Moon Icon for Dark Mode -->
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z" />
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { useDark } from '@vueuse/core';
export default {
  name: 'NavBar',
  setup() {
    const isDark = useDark();
    return {
      isDark,
      toggleDark: () => {
        isDark.value = !isDark.value;
      }
    };
  },
  data() {
    return {
      documentName: ''
    };
  },
  methods: {
    saveDocumentName() {
      // Add your logic to save the document name
    }
  }
};
</script>

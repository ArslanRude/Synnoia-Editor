<template>
  <nav>
    <div class="bg-secondary-light dark:bg-secondary-dark px-3 sm:px-5 py-2 flex items-center justify-between">
      <!-- Left: Logo and Brand -->
      <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center">
          <img src="/src/assets/logo/Synnoia Logo.svg" alt="Synnoia Logo" class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span class="text-text-light dark:text-text-dark font-semibold text-sm sm:text-lg">Synnoia</span>
      </div>

      <!-- Center: Editable Document Name -->
      <div class="hidden sm:flex flex-1 justify-center px-4">
        <input v-model="documentName"
          class="bg-transparent text-text-light dark:text-text-dark text-center font-medium text-sm sm:text-base border-none outline-none focus:bg-highlight-light dark:focus:bg-highlight-dark rounded px-2 py-1 min-w-0 max-w-xs dark:text-white"
          placeholder="Untitled Document" @blur="saveDocumentName" @keydown.enter="$event.target.blur()" />
      </div>

      <!-- Mobile Document Name (compact) -->
      <div class="flex sm:hidden flex-1 justify-center px-2">
        <input v-model="documentName"
          class="bg-transparent text-text-light dark:text-text-dark text-center font-medium text-sm border-none outline-none focus:bg-highlight-light dark:focus:bg-highlight-dark rounded px-1 py-1 min-w-0 max-w-[120px] dark:text-white"
          placeholder="Untitled" @blur="saveDocumentName" @keydown.enter="$event.target.blur()" />
      </div>

      <!-- Right: Theme Toggle (Desktop) -->
      <div class="hidden md:flex items-center space-x-2 flex-shrink-0">
        <button
          class="p-2 hover:bg-highlight-light dark:hover:bg-highlight-dark rounded-lg transition-colors duration-200 text-black dark:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
        <UserMenu />
        <button
          class="p-2 hover:bg-highlight-light dark:hover:bg-highlight-dark rounded-lg transition-colors duration-200 text-black dark:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          @click="toggleSidebar">
          <icon name="sidebar" size="20" color="currentcolor" />
        </button>
      </div>

      <!-- Mobile: Sidebar button + Hamburger Menu -->
      <div class="flex md:hidden items-center space-x-1 flex-shrink-0">
        <!-- Sidebar button OUTSIDE hamburger (directly visible) -->
        <button
          class="p-2 hover:bg-highlight-light dark:hover:bg-highlight-dark rounded-lg transition-colors duration-200 text-text-light dark:text-text-dark min-w-[44px] min-h-[44px] flex items-center justify-center"
          @click="toggleSidebar">
          <icon name="sidebar" size="20" color="currentcolor" />
        </button>

        <!-- Hamburger Menu Button -->
        <button
          class="p-2 hover:bg-highlight-light dark:hover:bg-highlight-dark rounded-lg transition-colors duration-200 text-text-light dark:text-text-dark min-w-[44px] min-h-[44px] flex items-center justify-center"
          @click="showMobileMenu = true">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Teleport to="body">
          <div v-if="showMobileMenu" 
              style="position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.5)"
              @click="showMobileMenu = false">
          </div>

          <!-- Drawer Panel -->
          <div :class="showMobileMenu ? 'menu-open' : ''"
              style="position:fixed;top:0;right:0;height:100%;width:280px;z-index:9999;
                      transform:translateX(100%);transition:transform 0.25s ease;
                      display:flex;flex-direction:column;"
              :style="showMobileMenu 
                ? 'transform:translateX(0)' 
                : 'transform:translateX(100%)'">

            <!-- Reuse your existing mobile-menu-panel content here -->
            <div class="mobile-menu-panel">
              <div class="mobile-menu-header">
                <span class="mobile-menu-title">Menu</span>
                <button type="button" class="mobile-menu-close" @click="showMobileMenu = false">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div class="mobile-menu-content">
                <!-- Theme Toggle -->
                <button type="button" class="mobile-menu-item" @click="toggleDark(); showMobileMenu = false">
                  <span class="mobile-menu-icon">
                    <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  </span>
                  <span class="mobile-menu-label">{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
                </button>

                <!-- Dashboard -->
                <a 
                  href="https://synnoia.vercel.app/app/dashboard.html"
                  class="mobile-menu-item"
                  @click="showMobileMenu = false"
                >
                  <span class="mobile-menu-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </span>
                  <span class="mobile-menu-label">Dashboard</span>
                </a>

                <!-- Login -->
                <a 
                  href="https://synnoia.vercel.app/auth/login.html"
                  class="mobile-menu-item"
                  @click="showMobileMenu = false"
                >
                  <span class="mobile-menu-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                  </span>
                  <span class="mobile-menu-label">Sign In</span>
                </a>

                <div class="mobile-menu-divider"></div>

                <!-- Save -->
                <button type="button" class="mobile-menu-item" :class="{ 'is-saved': isSaved }"
                        @click="saveDocument(); showMobileMenu = false">
                  <span class="mobile-menu-icon">
                    <span class="save-status-dot" :class="isSaved ? 'saved' : 'unsaved'"></span>
                  </span>
                  <span class="mobile-menu-label">{{ isSaved ? 'Saved' : 'Save Document' }}</span>
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </div>
  </nav>
</template>

<script>
import { inject } from 'vue';
import { useDark } from '@vueuse/core';
import UserMenu from './UserMenu.vue';
export default {
  name: 'NavBar',
  components: {
    UserMenu
  },
  emits: ['toggle-sidebar'],
  setup(props, { emit }) {
    const isDark = useDark();

    // Inject save functionality from parent
    const saveContentMethod = inject('saveContent');

    return {
      isDark,
      saveContentMethod,
      toggleDark: () => {
        isDark.value = !isDark.value;
      },
      toggleSidebar: () => {
        emit('toggle-sidebar');
      }
    };
  },
  data() {
    return {
      documentName: '',
      isSaved: false,
      lastSaved: null,
      showMobileMenu: false
    };
  },
  methods: {
    saveDocumentName() {
      // Add your logic to save the document name
    },
    closeMobileMenu() {
      this.showMobileMenu = false;
    },
    saveDocument() {
      // Call the actual save method from parent
      if (this.saveContentMethod) {
        this.saveContentMethod();
        this.isSaved = true;
        this.lastSaved = new Date();

        // Reset status after 3 seconds
        setTimeout(() => {
          this.isSaved = false;
        }, 3000);
      } else {
        console.warn('saveContent method not available');
      }
    }
  }
};
</script>

<style scoped>
/* Mobile responsive navbar fixes */
@media (max-width: 640px) {
  nav>div {
    padding-left: 8px;
    padding-right: 8px;
  }

  /* Smaller logo and text on tiny screens */
  .flex-shrink-0:first-child span {
    font-size: 12px;
  }

  /* Document name input smaller */
  input.max-w-\[120px\] {
    max-width: 100px;
    font-size: 11px;
  }
}

@media (max-width: 380px) {

  /* Hide Synnoia text on very small screens, show only logo */
  .flex-shrink-0:first-child span {
    display: none;
  }

  /* Even smaller input */
  input.max-w-\[120px\] {
    max-width: 80px;
  }

  /* Smaller buttons */
  .min-w-\[44px\] {
    min-width: 36px;
    min-height: 36px;
    padding: 6px;
  }

  .min-w-\[44px\] svg {
    width: 18px;
    height: 18px;
  }
}

/* Mobile Menu Panel Styles - Simple and Professional like Sidebar */
.mobile-menu-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.dark .mobile-menu-panel {
  background: #111827;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dark .mobile-menu-header {
  border-bottom-color: #374151;
}

.mobile-menu-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.dark .mobile-menu-title {
  color: #f3f4f6;
}

.mobile-menu-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 100;
  pointer-events: auto;
}

.mobile-menu-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.dark .mobile-menu-close {
  color: #9ca3af;
}

.dark .mobile-menu-close:hover {
  background: #374151;
  color: #f3f4f6;
}

.mobile-menu-content {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
}

.mobile-menu-item:hover {
  background: #f3f4f6;
}

.dark .mobile-menu-item:hover {
  background: #374151;
}

.mobile-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.dark .mobile-menu-icon {
  color: #9ca3af;
}

.mobile-menu-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.dark .mobile-menu-label {
  color: #d1d5db;
}

.mobile-menu-divider {
  height: 1px;
  margin: 8px 16px;
  background: #e5e7eb;
}

.dark .mobile-menu-divider {
  background: #374151;
}

.save-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.save-status-dot.saved {
  background: #22c55e;
}

.save-status-dot.unsaved {
  background: #ef4444;
}

.mobile-menu-item.is-saved .mobile-menu-label {
  color: #22c55e;
}
</style>

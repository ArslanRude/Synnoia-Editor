import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import ReactivityTransform from '@vue-macros/reactivity-transform/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { TDesignResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import { defineConfig } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  base: '/',  // Changed from '/my-word' to '/'
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    ReactivityTransform(),
    VueMacros({
      plugins: {
        vue: Vue(),
      },
    }),
    AutoImport({
      dirs: ['./src/composables'],
      imports: ['vue', '@vueuse/core'],
      resolvers: [TDesignResolver({ library: 'vue-next', esm: true })],
      dts: './types/imports.d.ts',
    }),
    Components({
      directoryAsNamespace: true,
      dirs: ['./src/components'],
      resolvers: [TDesignResolver({ library: 'vue-next', esm: true })],
      dts: './types/components.d.ts',
    }),
    createSvgIconsPlugin({
      iconDirs: [`${process.cwd()}/src/assets/icons`],
      symbolId: 'arslan-icon-[name]',
      customDomId: 'arslan-icons',
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: { '@prefix': 'arslan' },
        javascriptEnabled: true,
      },
    },
  },
  // No 'build.lib' block — this is the key difference
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: true,
  },
  resolve: {
    alias: {
      '@': `${process.cwd()}/src`,
    },
  },
})
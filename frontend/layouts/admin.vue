<script setup>
</script>

<template>
  <div class="admin-layout flex">
    <!-- Sidebar -->
    <AdminSidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <AppHeader />
      <main class="p-6 bg-gray-100 min-h-screen">
        <slot />
      </main>
      <footer class="bg-gray-800 text-white text-center py-4">
        &copy; 2025 Canard Musclé - BackOffice
      </footer>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}
</style>

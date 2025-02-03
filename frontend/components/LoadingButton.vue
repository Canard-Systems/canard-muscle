<script setup>
const props = defineProps({
  isLoading: Boolean,
  class: String
});
</script>

<template>
  <button
      :disabled="isLoading"
      :class="[props.class, 'w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none flex items-center justify-center']"
  >
    <span v-if="isLoading" class="loader"></span>
    <span v-else><slot></slot></span>
  </button>
</template>

<style scoped>
.loader {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 class="text-xl font-bold mb-2">{{ title }}</h2>
      <p class="mb-4">{{ message }}</p>
      <div class="flex justify-end space-x-2">
        <button @click="$emit('cancel')" class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
          Annuler
        </button>
        <button @click="$emit('confirm')" class="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
          Confirmer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  message: String,
});
defineEmits(['confirm', 'cancel']);
</script>

<template>
  <button
      class="tool-card"
      :class="{ active }"
      @click="$emit('click')"
  >
    <div class="icon">{{ icon }}</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
  active?: boolean
}>()

defineEmits(['click'])
</script>

<style scoped>
.tool-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
  cursor: pointer;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.tool-card.active {
  background-color: #f0f7ff;
  box-shadow: 0 4px 6px rgba(0, 119, 255, 0.2);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

p {
  color: #666;
  margin: 0;
}
</style>
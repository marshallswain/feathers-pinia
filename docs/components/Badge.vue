<script setup>
defineProps({
  type: {
    type: String,
    default: 'tip',
  },
  label: {
    type: String,
    default: '',
  },
  vertical: {
    type: String,
    default: 'middle',
  },
})
</script>

<!-- eslint-disable vue/max-attributes-per-line -->
<template>
  <span class="badge" :class="type" :style="{ verticalAlign: vertical }">{{ label }}
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  font-size: 14px;
  height: 18px;
  line-height: 18px;
  border-radius: 3px;
  padding: 0 6px;
  color: white;
  background-color: #42b983;
}

.badge.tip,
.badge.green {
  background-color: #42b983;
}

.badge.error {
  background-color: #da5961;
}
.badge.danger {
  background-color: #da5961;
}

.badge.warning,
.badge.warn,
.badge.yellow {
  background-color: #ffe564;
}

.badge+.badge {
  margin-left: 5px;
}
</style>

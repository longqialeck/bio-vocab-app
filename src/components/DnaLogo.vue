<template>
  <div class="dna-logo" :class="{ 'large': large }">
    <q-icon name="o_biotech" :size="large ? '100px' : '50px'" color="primary" />
  </div>
</template>

<script>
export default {
  name: 'DnaLogo',
  props: {
    large: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.dna-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

.dna-logo.large {
  width: 120px;
  height: 120px;
}
</style> 
<template>
  <q-dialog v-model="model">
    <q-card style="width: min(420px, 100%)">
      <q-card-section>
        <div class="text-h6">Adjust Points</div>
      </q-card-section>
      <q-card-section>
        <q-select v-model="childId" :options="childOptions" emit-value map-options label="Child" filled />
        <q-input v-model.number="delta" class="q-mt-md" type="number" label="Point change" filled />
        <q-input v-model="reason" class="q-mt-md" label="Reason" filled />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn color="primary" label="Save" :disable="!childId || !delta || !reason" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChildrenStore } from 'src/stores/children';

const model = defineModel<boolean>({ required: true });
const emit = defineEmits<{ saved: [] }>();
const children = useChildrenStore();

const childId = ref<number | null>(null);
const delta = ref(1);
const reason = ref('');
const childOptions = computed(() => children.children.map((child) => ({ label: child.name, value: child.id })));

async function save() {
  if (!childId.value || !reason.value) return;
  await children.adjustPoints(childId.value, Number(delta.value), reason.value);
  model.value = false;
  emit('saved');
}
</script>

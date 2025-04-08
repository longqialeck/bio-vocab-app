<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          BioVocab 管理系统
        </q-toolbar-title>

        <q-btn-dropdown flat icon="person">
          <q-list>
            <q-item clickable v-close-popup @click="logout">
              <q-item-section>
                <q-item-label>退出登录</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-list>
        <q-item-label header class="text-grey-8">
          管理菜单
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/userStore'

// 管理菜单链接
const linksList = [
  {
    title: '仪表盘',
    caption: '系统概览',
    icon: 'dashboard',
    routeName: 'admin-dashboard'
  },
  {
    title: '用户管理',
    caption: '管理系统用户',
    icon: 'people',
    routeName: 'admin-users'
  },
  {
    title: '词汇管理',
    caption: '管理词汇模块和内容',
    icon: 'menu_book',
    routeName: 'admin-vocabulary'
  },
  {
    title: '返回前台',
    caption: '回到学习界面',
    icon: 'arrow_back',
    routeName: 'dashboard'
  }
]

// 链接组件
const EssentialLink = defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    routeName: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const router = useRouter()
    
    const navigateTo = () => {
      router.push({ name: props.routeName })
    }
    
    return { navigateTo }
  },
  template: `
    <q-item clickable @click="navigateTo">
      <q-item-section v-if="icon" avatar>
        <q-icon :name="icon" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ title }}</q-item-label>
        <q-item-label caption>{{ caption }}</q-item-label>
      </q-item-section>
    </q-item>
  `
})

export default defineComponent({
  name: 'AdminLayout',
  components: { EssentialLink },
  setup() {
    const leftDrawerOpen = ref(false)
    const router = useRouter()
    const userStore = useUserStore()
    
    const essentialLinks = linksList
    
    const logout = () => {
      userStore.logout()
      router.push({ name: 'login' })
    }
    
    return {
      leftDrawerOpen,
      essentialLinks,
      logout
    }
  }
})
</script> 
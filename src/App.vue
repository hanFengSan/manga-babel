<template>
    <div id="app">
        <hello></hello>
    </div>
</template>

<script>
import Hello from './components/Hello'

export default {
    name: 'app',
    components: {
        Hello
    }
}
</script>

<style lang="less">
@less-ll: 14px;
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
    &.app {
        font-size: 14px;
    }
}
</style>

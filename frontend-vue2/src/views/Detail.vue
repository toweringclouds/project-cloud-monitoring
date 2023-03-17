<template>
    <modal name="detail-view">
        <div>{{ text }}</div>
    </modal >
</template>

<script>
export default {
    name: 'Detail',
    props: ['text'],
    methods: {
        show () {
            this.$modal.show('detail-view');
        },
        hide () {
            this.$modal.hide('detail-view');
        }
    },
    mount () {
        this.show()
    }    
}
</script>

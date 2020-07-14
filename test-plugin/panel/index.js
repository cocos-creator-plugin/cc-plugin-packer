// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
    // css style for panel
    style: ``,

    // html template for panel
    template: ``,

    // element and variable binding
    $: {
        btn: '#btn',
        label: '#label',
    },

    // method executed when template and styles are successfully loaded and initialized
    ready () {
        this.$btn.addEventListener('confirm', () => {
            Editor.Ipc.sendToMain('fsf:clicked');
        });
    },

    // register your ipc messages here
    messages: {
        'fsf:hello' (event) {
            this.$label.innerText = 'Hello!';
        }
    }
});
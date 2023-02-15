# flowdash.js


## Integration steps 

```html
<script type="text/javascript">
    var s = document.createElement('script')
    s.src = 'http://js.flowdash.ai/flowdash.js'
    s.async = true;
    document.head.appendChild(s);
    s.onload = function () {
      flowdash.init('FLOWDASH_APP_ID','FLOWDASH_API_KEY');
    }
</script>
```